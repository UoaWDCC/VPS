import { getComponentProp } from "../scene";
import type { ModelCursor, ModelSelection } from "../../text/types";
import type { BaseTextStyle, ModelBlock, ModelDocument, ModelSpan } from "../../types";
import { squash } from "../../text/build";
import useEditorStore from "../../stores/editor";
import { objectDiff } from "../../util";
import shallow from "zustand/shallow";
import { modify } from "./modifiers";

export const insertChar = modify((id: string, cursor: ModelCursor, char: string) => {
  const doc = getComponentProp(id, "document") as ModelDocument;

  const diff = objectDiff(useEditorStore.getState().activeStyle!, squash(doc.style));

  const block = doc.blocks[cursor.blockI];
  const target = block.spans[cursor.spanI];

  if (shallow(diff, target.style)) { // if we're the same style as prev span
    const modified = target.text.slice(0, cursor.charI) + char + target.text.slice(cursor.charI);
    block.spans[cursor.spanI].text = modified;
  } else { // otherwise we need to make a new span
    splitSpan(doc.blocks, cursor);
    if (cursor.charI > 0) block.spans.splice(cursor.spanI + 1, 0, { text: char, style: diff });
    else block.spans.splice(cursor.spanI, 0, { text: char, style: diff }); // block start
  }

  return moveCursor(id, cursor, 1);
});

export const deleteChar = modify((id: string, cursor: ModelCursor) => {
  if (!cursor.blockI && !cursor.spanI && !cursor.charI) return cursor; // start of text

  const newCursor = moveCursor(id, cursor, -1);

  const doc = getComponentProp(id, `document`) as ModelDocument;
  const spans = doc.blocks[cursor.blockI].spans;

  if (newCursor.blockI === cursor.blockI && newCursor.spanI === cursor.spanI) {
    // within span
    const target = spans[cursor.spanI].text;
    const modified = target.slice(0, cursor.charI - 1) + target.slice(cursor.charI);
    spans[cursor.spanI].text = modified;
  } else if (newCursor.blockI === cursor.blockI) { // at span boundary
    const target = spans[cursor.spanI - 1].text;
    if (newCursor.charI === target.length) { // first char in span
      const modified = spans[cursor.spanI].text.slice(1);
      spans[cursor.spanI].text = modified;
    } else { // last char in prev span
      const modified = target.slice(0, target.length - 1);
      spans[cursor.spanI - 1].text = modified;
    }
  } else { // at block boundary
    doc.blocks.splice(cursor.blockI, 1);
    doc.blocks[cursor.blockI - 1].spans.push(...spans);
  }

  // needs normalisation to remove leftover empty spans from char deletion
  return normaliseDocument(doc, newCursor);
});

// NOTE: will cause two distinct state operations in history
export function insertSelection(id: string, sel: ModelSelection, char: string) {
  const cursor = deleteSelection(id, sel);
  return insertChar(id, cursor, char);
}

export const deleteSelection = modify((id: string, sel: ModelSelection) => {
  const doc = getComponentProp(id, `document`) as ModelDocument;
  const { blocks } = doc;

  const normd = normaliseSelection(sel);
  const { start, end } = isolateSelection(id, normd);

  const startBlock = blocks[start.blockI];
  const endBlock = blocks[end.blockI];

  let newSpans = [
    ...startBlock.spans.slice(0, start.charI > 0 ? start.spanI + 1 : 0),
    ...endBlock.spans.slice(end.charI > 0 ? end.spanI + 1 : 0),
  ];

  // occurs if the selection perfectly aligns across block boundaries
  if (!newSpans.length) newSpans = [{ text: "", style: startBlock.spans[0].style }];

  const newBlock = { spans: newSpans, style: startBlock.style };
  blocks.splice(start.blockI, end.blockI - start.blockI + 1, newBlock);

  // needs normalisation to merge adjacent spans with the same style
  return normaliseDocument(doc, start);
});

export const createBlock = modify((id: string, cursor: ModelCursor) => {
  const blocks = getComponentProp(id, `document.blocks`) as ModelBlock[];
  const block = blocks[cursor.blockI];

  splitSpan(blocks, cursor);

  const oldSpans = cursor.charI > 0 ? block.spans.slice(0, cursor.spanI + 1) : [];
  const newSpans = block.spans.slice(cursor.charI > 0 ? cursor.spanI + 1 : 0);

  if (!newSpans.length) {
    const span = block.spans[cursor.spanI];
    newSpans.push({ text: "", style: span.style ? { ...span.style } : {} });
  }

  // start of the block assumes document style
  if (!oldSpans.length) {
    const span = block.spans[cursor.spanI];
    oldSpans.push({ text: "", style: span.style ? { ...span.style } : {} });
  }

  block.spans = oldSpans;
  blocks.splice(cursor.blockI + 1, 0, { spans: newSpans, style: { ...block.style } });

  return { blockI: cursor.blockI + 1, spanI: 0, charI: 0 };
});

export const applySelectionStyle = modify((id: string, sel: ModelSelection, style: Partial<BaseTextStyle>) => {
  const doc = getComponentProp(id, `document`) as ModelDocument;
  const { blocks } = doc;

  const { start, end } = isolateSelection(id, normaliseSelection(sel));

  if (style.alignment || style.lineHeight) {
    for (let i = sel.start!.blockI; i <= sel.end!.blockI; i++) {
      if (style.alignment) blocks[i].style!.alignment = style.alignment;
      if (style.lineHeight) blocks[i].style!.lineHeight = style.lineHeight;
    }
  }

  const rangeStart = start.charI > 0 ? { ...start, spanI: start.spanI + 1 } : start;
  for (const { span } of spanRange(blocks, { start: rangeStart, end })) {
    span.style = { ...span.style, ...style };
  }

  // needs normalisation to merge adjacent spans with the same style 
  const newEnd = normaliseDocument(doc, end); // for this specific situation the start cursor would never move

  return { start, end: newEnd };
});

export function getStyleForSelection(id: string, sel: ModelSelection) {
  const doc = getComponentProp(id, "document");
  const { start, end } = sel;

  if (start == null) return squash(doc.style); // no selection

  if (end) { // full sel
    // TODO: choose the least specificity present across selected spans (prefer false for toggles, unknown for values)
    const block = doc.blocks[end.blockI];
    return squash(doc.style, block.style, block.spans[end.spanI].style);
  }

  // start only (cursor)
  const block = doc.blocks[start.blockI];
  return squash(doc.style, block.style, block.spans[start.spanI].style);
}

function isReversed(start: ModelCursor, end: ModelCursor) {
  if (end.blockI !== start.blockI) return end.blockI < start.blockI;
  if (end.spanI !== start.spanI) return end.spanI < start.spanI;
  return end.charI < start.charI;
}
function normaliseSelection(sel: ModelSelection) {
  let { start, end } = sel;
  if (start && end && isReversed(start, end)) [start, end] = [end, start];
  return { start, end };
}

export function normaliseCursor(blocks: ModelBlock[], cursor: ModelCursor) {
  // if at start of span but not the first span then move to prev span end
  if (cursor.charI === 0 && cursor.spanI > 0) {
    const prev = blocks[cursor.blockI].spans[cursor.spanI - 1];
    return {
      blockI: cursor.blockI,
      spanI: cursor.spanI - 1,
      charI: prev.text.length,
    };
  }
  return cursor;
}

function moveCursor(id: string, cursor: ModelCursor, amount: number) {
  let { blockI, spanI, charI } = cursor;
  const blocks: ModelBlock[] = getComponentProp(id, `document.blocks`);

  while (amount !== 0) {
    const block = blocks[blockI];
    const span = block.spans[spanI];

    if (amount > 0) {
      // moving right
      if (charI < span.text.length) { // within span
        charI++;
        amount--;
      } else if (spanI < block.spans.length - 1) { // at span boundary
        spanI++;
        charI = 1;
        amount--;
      } else if (blockI < blocks.length - 1) { // at block boundary
        blockI++;
        spanI = 0;
        charI = 0;
        amount--;
      } else { // end of container
        break;
      }
    } else {
      // moving left
      if (charI > 0) { // within span
        charI--;
        amount++;
      } else if (spanI > 0) { // at span boundary
        spanI--;
        charI = block.spans[spanI].text.length - 1;
        amount++;
      } else if (blockI > 0) { // at block boundary
        blockI--;
        spanI = blocks[blockI].spans.length - 1;
        charI = blocks[blockI].spans[spanI].text.length;
        amount++;
      } else {
        break; // start of container
      }
    }
  }

  return normaliseCursor(blocks, { blockI, spanI, charI });
}

function* spanRange(blocks: ModelBlock[], sel: { start: ModelCursor, end: ModelCursor }) {
  const { start, end } = sel;
  for (let b = start.blockI; b <= end.blockI; b++) {
    const startSpan = (b === start.blockI ? start.spanI : 0);
    const endSpan = (b === end.blockI ? end.spanI : blocks[b].spans.length - 1);

    for (let s = startSpan; s <= endSpan; s++) {
      yield { b, s, span: blocks[b].spans[s] };
    }
  }
}

function splitSpan(blocks: ModelBlock[], cursor: ModelCursor) {
  const block = blocks[cursor.blockI];
  const span = block.spans[cursor.spanI];

  const left = span.text.slice(0, cursor.charI);
  const right = span.text.slice(cursor.charI);

  // already at boundary
  if (!left.length || !right.length) return cursor;

  const leftSpan = { ...span, text: left };
  const rightSpan = { ...span, text: right };

  block.spans.splice(cursor.spanI, 1, leftSpan, rightSpan);

  return cursor;
}

function isolateSelection(id: string, sel: ModelSelection) {
  const blocks = getComponentProp(id, "document.blocks");
  const end = splitSpan(blocks, sel.end!);

  const before = blocks[sel.start!.blockI].spans.length;
  const start = splitSpan(blocks, sel.start!);

  if (before !== blocks[start.blockI].spans.length) { // the starting span actually split
    if (end.blockI === start.blockI) {
      end.spanI++;
      if (end.spanI === start.spanI + 1)
        end.charI = blocks[end.blockI].spans[end.spanI].text.length;
    }
  }

  return { start, end };
}

export function normaliseDocument(doc: ModelDocument, cursor: ModelCursor) {
  const newCursor = { ...cursor };

  if (!doc.blocks[0].spans.length) {
    doc.blocks[0].spans.push({ text: "", style: {} });
  }

  for (let i = 0; i < doc.blocks.length; i++) {
    const block = doc.blocks[i];
    const isCursorBlock = i === cursor.blockI;

    const normdSpans = [] as ModelSpan[];
    for (let s = 0; s < block.spans.length; s++) {
      const span = block.spans[s];

      // remove empty spans except for ones that are the only in a block
      if (span.text.length === 0) {
        if (isCursorBlock && s < cursor.spanI) newCursor.spanI--;
        continue;
      };

      // merge adjacent spans with the same style
      const style = objectDiff(span.style!, squash(doc.style));
      const prev = normdSpans[normdSpans.length - 1];
      if (prev && shallow(style, prev.style)) {
        if (isCursorBlock && s <= cursor.spanI) {
          newCursor.spanI--;
          if (s === cursor.spanI) newCursor.charI += prev.text.length;
        }
        prev.text += span.text;
        continue;
      }

      span.style = style;
      normdSpans.push(span);
    }

    // if the block has no meaningful text, ensure that it keeps one empty span
    if (normdSpans.length === 0) normdSpans.push(block.spans[0]);

    block.spans = normdSpans;
  }

  return newCursor;
}

export function getDocumentText(id: string) {
  const blocks = getComponentProp(id, "document.blocks");

  let text = "";
  for (const block of blocks) {
    for (const span of block.spans) {
      text += span.text;
    }
    text += "\n";
  }
  return text;
}

export function getSelectionContent(id: string, sel: ModelSelection) {
  const doc = getComponentProp(id, "document");
  const { blocks } = doc;
  const { start, end } = normaliseSelection(sel) as { start: ModelCursor, end: ModelCursor };

  // if the selection is single span
  if (start.blockI === end.blockI && start.spanI === end.spanI) {
    const block = blocks[start.blockI];
    const span = block.spans[start.spanI];
    const text = span.text.slice(start.charI, end.charI);
    const newDoc = { ...doc, blocks: [{ ...block, spans: [{ ...span, text }] }] };
    return { text, doc: newDoc };
  }

  let text = "";
  const newDoc = { ...doc, blocks: [] };

  for (let b = start.blockI; b <= end.blockI; b++) {
    const startSpan = (b === start.blockI ? start.spanI : 0);
    const endSpan = (b === end.blockI ? end.spanI : blocks[b].spans.length - 1);

    const nb = b - start.blockI;
    const block = blocks[b];
    newDoc.blocks.push({ ...block, spans: [] });

    for (let s = startSpan; s <= endSpan; s++) {
      const span = blocks[b].spans[s];

      if (b === start.blockI && s === start.spanI) {
        const content = span.text.slice(start.charI);
        text += content;
        newDoc.blocks[nb].spans.push({ ...span, text: content });
      } else if (b === end.blockI && s === end.spanI) {
        const content = span.text.slice(0, end.charI);
        text += content;
        newDoc.blocks[nb].spans.push({ ...span, text: content });
      } else {
        text += span.text;
        newDoc.blocks[nb].spans.push({ ...span });
      }
    }

    text += "\n";
  }

  return { text, doc: newDoc };
}

function squashSpanStyles(doc: ModelDocument) {
  doc.blocks.forEach(b => {
    b.spans.forEach(s => {
      s.style = { ...doc.style, ...s.style };
    })
  });
}

function getExtremeCursor(doc: ModelDocument) {
  const blockI = doc.blocks.length - 1;
  const block = doc.blocks[blockI];
  const spanI = block.spans.length - 1;
  const span = block.spans[spanI];
  const charI = span.text.length;

  return { blockI, spanI, charI };
}

export const mergeDocs = modify((id: string, cursor: ModelCursor, doc: ModelDocument) => {
  const original = getComponentProp(id, "document") as ModelDocument;
  squashSpanStyles(doc);

  const extreme = getExtremeCursor(doc);

  if (doc.blocks.length === 1) {
    splitSpan(original.blocks, cursor);
    const block = original.blocks[cursor.blockI];
    const spans = doc.blocks[0].spans;
    block.spans.splice(cursor.charI > 0 ? cursor.spanI + 1 : 0, 0, ...spans);

    const spanI = (cursor.charI > 0 ? cursor.spanI + 1 : 0) + extreme.spanI;
    return { blockI: cursor.blockI, spanI, charI: extreme.charI };
  } else {
    splitSpan(original.blocks, cursor);
    const block = original.blocks[cursor.blockI];
    const spans = doc.blocks[0].spans;
    const lhs = block.spans.slice(0, cursor.charI > 0 ? cursor.spanI + 1 : 0);
    const rhs = block.spans.slice(cursor.charI > 0 ? cursor.spanI + 1 : 0);
    block.spans = [...lhs, ...spans];

    const intermediates = doc.blocks.slice(1, doc.blocks.length - 1);
    original.blocks.splice(cursor.blockI + 1, 0, ...intermediates);

    const finalBlock = doc.blocks[doc.blocks.length - 1];
    const newBlock = { ...block, spans: [...finalBlock.spans, ...rhs] }
    original.blocks.splice(cursor.blockI + doc.blocks.length - 1, 0, newBlock);

    const blockI = cursor.blockI + extreme.blockI;
    return { blockI, spanI: extreme.spanI, charI: extreme.charI };
  }
});
