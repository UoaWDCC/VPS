import { getComponentProp } from "../scene";
import type { ModelCursor, ModelSelection } from "../../text/types";
import type {
  BaseTextStyle,
  ListMarkerStyle,
  ModelBlock,
  ModelDocument,
  ModelSpan,
} from "../../types";
import { squash } from "../../text/build";
import useEditorStore from "../../stores/editor";
import { objectDiff } from "../../util";
import shallow from "zustand/shallow";
import { modify } from "./modifiers";

export const insertChar = modify(
  (id: string[], cursor: ModelCursor, char: string) => {
    const doc = getComponentProp(id[0], "document") as ModelDocument;

    const diff = objectDiff(
      useEditorStore.getState().activeStyle!,
      squash(doc.style)
    );

    const block = doc.blocks[cursor.blockI];
    const target = block.spans[cursor.spanI];

    if (shallow(diff, target.style)) {
      // if we're the same style as prev span
      const modified =
        target.text.slice(0, cursor.charI) +
        char +
        target.text.slice(cursor.charI);
      block.spans[cursor.spanI].text = modified;
    } else {
      // otherwise we need to make a new span
      splitSpan(doc.blocks, cursor);
      if (cursor.charI > 0)
        block.spans.splice(cursor.spanI + 1, 0, { text: char, style: diff });
      else block.spans.splice(cursor.spanI, 0, { text: char, style: diff }); // block start
    }

    return moveCursor(id[0], cursor, 1);
  }
);

export const deleteChar = modify((id: string[], cursor: ModelCursor) => {
  if (!cursor.blockI && !cursor.spanI && !cursor.charI) return cursor; // start of text

  const newCursor = moveCursor(id[0], cursor, -1);

  const doc = getComponentProp(id[0], `document`) as ModelDocument;
  const spans = doc.blocks[cursor.blockI].spans;

  if (newCursor.blockI === cursor.blockI && newCursor.spanI === cursor.spanI) {
    // within span
    const target = spans[cursor.spanI].text;
    const modified =
      target.slice(0, cursor.charI - 1) + target.slice(cursor.charI);
    spans[cursor.spanI].text = modified;
  } else if (newCursor.blockI === cursor.blockI) {
    // at span boundary
    const target = spans[cursor.spanI - 1].text;
    if (newCursor.charI === target.length) {
      // first char in span
      const modified = spans[cursor.spanI].text.slice(1);
      spans[cursor.spanI].text = modified;
    } else {
      // last char in prev span
      const modified = target.slice(0, target.length - 1);
      spans[cursor.spanI - 1].text = modified;
    }
  } else {
    // at block boundary
    doc.blocks.splice(cursor.blockI, 1);
    doc.blocks[cursor.blockI - 1].spans.push(...spans);
  }

  // needs normalisation to remove leftover empty spans from char deletion
  return normaliseDocument(doc, newCursor);
});

// NOTE: will cause two distinct state operations in history
export function insertSelection(id: string, sel: ModelSelection, char: string) {
  const cursor = deleteSelection([id], sel);
  return insertChar([id], cursor, char);
}

export const deleteSelection = modify((id: string[], sel: ModelSelection) => {
  const doc = getComponentProp(id[0], `document`) as ModelDocument;
  const { blocks } = doc;

  const normd = normaliseSelection(sel);
  const { start, end } = isolateSelection(id[0], normd);

  const startBlock = blocks[start.blockI];
  const endBlock = blocks[end.blockI];

  let newSpans = [
    ...startBlock.spans.slice(0, start.charI > 0 ? start.spanI + 1 : 0),
    ...endBlock.spans.slice(end.charI > 0 ? end.spanI + 1 : 0),
  ];

  // occurs if the selection perfectly aligns across block boundaries
  if (!newSpans.length)
    newSpans = [{ text: "", style: startBlock.spans[0].style }];

  const newBlock = {
    spans: newSpans,
    style: startBlock.style,
    list: startBlock.list ? { ...startBlock.list } : undefined,
    softBreak: startBlock.softBreak,
  };
  blocks.splice(start.blockI, end.blockI - start.blockI + 1, newBlock);

  // needs normalisation to merge adjacent spans with the same style
  return normaliseDocument(doc, start);
});

// splits the block at the cursor into "before"/"after" span lists, leaving
// the "before" half in place -- shared by createBlock and createSoftBreak,
// which differ only in what they attach to the new "after" block
function splitBlockAtCursor(blocks: ModelBlock[], cursor: ModelCursor) {
  const block = blocks[cursor.blockI];

  splitSpan(blocks, cursor);

  const oldSpans =
    cursor.charI > 0 ? block.spans.slice(0, cursor.spanI + 1) : [];
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
  return { block, newSpans };
}

export const createBlock = modify((id: string[], cursor: ModelCursor) => {
  const blocks = getComponentProp(id[0], `document.blocks`) as ModelBlock[];
  const { block, newSpans } = splitBlockAtCursor(blocks, cursor);

  blocks.splice(cursor.blockI + 1, 0, {
    spans: newSpans,
    style: { ...block.style },
    list: block.list ? { ...block.list, checked: false } : undefined,
  });

  return { blockI: cursor.blockI + 1, spanI: 0, charI: 0 };
});

// Shift+Enter: a soft line break -- stays part of the same list item (same
// marker/level) but renders no marker of its own
export const createSoftBreak = modify((id: string[], cursor: ModelCursor) => {
  const blocks = getComponentProp(id[0], `document.blocks`) as ModelBlock[];
  const { block, newSpans } = splitBlockAtCursor(blocks, cursor);

  blocks.splice(cursor.blockI + 1, 0, {
    spans: newSpans,
    style: { ...block.style },
    list: block.list ? { ...block.list } : undefined,
    softBreak: true,
  });

  return { blockI: cursor.blockI + 1, spanI: 0, charI: 0 };
});

const AUTO_BULLET_TRIGGERS: Record<string, ListMarkerStyle> = {
  "-": "dash",
  "*": "bullet",
};

// true when the cursor sits right after a leading "-" or "*" as the very
// first character of the line and the block isn't already a list -- the
// trigger for markdown-style "- "/"* " auto-bulleting on the next space.
// any text already following that leading character is left alone.
export function canAutoBullet(id: string, cursor: ModelCursor) {
  const doc = getComponentProp(id, "document") as ModelDocument;
  const block = doc.blocks[cursor.blockI];
  if (!block || block.list) return false;

  return (
    cursor.spanI === 0 &&
    cursor.charI === 1 &&
    block.spans[0].text[0] in AUTO_BULLET_TRIGGERS
  );
}

// consumes the leading "-"/"*" (the triggering space is not inserted) and
// turns the block into a list -- "-" becomes a dash marker, "*" becomes a
// round bullet -- preserving any text that already followed it
export const applyAutoBullet = modify((id: string[], cursor: ModelCursor) => {
  const doc = getComponentProp(id[0], "document") as ModelDocument;
  const block = doc.blocks[cursor.blockI];
  const span = block.spans[0];
  const trigger = span.text[0];
  const remaining = span.text.slice(1);

  if (remaining === "" && block.spans.length > 1) {
    block.spans.shift();
  } else {
    span.text = remaining;
  }

  block.list = { markerStyle: AUTO_BULLET_TRIGGERS[trigger], level: 0 };
  return { blockI: cursor.blockI, spanI: 0, charI: 0 };
});

// true when the cursor sits at the very start of an empty list block --
// the trigger for Enter to exit list formatting instead of adding another
// bulleted line
export function isEmptyListBlock(id: string, cursor: ModelCursor) {
  const doc = getComponentProp(id, "document") as ModelDocument;
  const block = doc.blocks[cursor.blockI];
  if (!block?.list) return false;

  return (
    cursor.spanI === 0 &&
    cursor.charI === 0 &&
    block.spans.length === 1 &&
    block.spans[0].text === ""
  );
}

// true when the cursor sits at the very start of a list block, whether or
// not it has content -- the trigger for Backspace to strip the bullet
// instead of merging into the previous block. a soft-break continuation
// has no marker of its own to strip, so it's excluded here and left to the
// normal merge-into-previous-block behaviour, which undoes the soft break
export function isStartOfListBlock(id: string, cursor: ModelCursor) {
  const doc = getComponentProp(id, "document") as ModelDocument;
  const block = doc.blocks[cursor.blockI];
  if (!block?.list || block.softBreak) return false;

  return cursor.spanI === 0 && cursor.charI === 0;
}

export const toggleChecked = modify((id: string[], blockI: number) => {
  const doc = getComponentProp(id[0], "document") as ModelDocument;
  const block = doc.blocks[blockI];
  if (!block.list) return;
  block.list.checked = !block.list.checked;
});

// 9 nesting levels, 0-indexed: 0-8
export const MAX_LIST_LEVEL = 8;

// applies to every block in the (inclusive) index range that already has a
// list marker -- plain paragraphs are left untouched, matching Tab's no-op
// behaviour on non-list lines
export const indentBlocks = modify(
  (id: string[], range: { start: number; end: number }, direction: 1 | -1) => {
    const doc = getComponentProp(id[0], "document") as ModelDocument;

    for (let i = range.start; i <= range.end; i++) {
      const block = doc.blocks[i];
      if (!block.list) continue;

      if (direction > 0) {
        block.list.level = Math.min(MAX_LIST_LEVEL, block.list.level + 1);
      } else if (block.list.level > 0) {
        block.list.level -= 1;
      } else {
        block.list = undefined;
        block.softBreak = undefined;
      }
    }
  }
);

// applies to every block in the (inclusive) index range: switching marker
// style preserves an existing level/checked state, "none" clears the list
export const setBlockListStyle = modify(
  (
    id: string[],
    range: { start: number; end: number },
    markerStyle: ListMarkerStyle | "none"
  ) => {
    const doc = getComponentProp(id[0], "document") as ModelDocument;

    for (let i = range.start; i <= range.end; i++) {
      const block = doc.blocks[i];
      if (markerStyle === "none") {
        block.list = undefined;
        block.softBreak = undefined;
      } else {
        block.list = {
          markerStyle,
          level: block.list?.level ?? 0,
          checked: block.list?.checked ?? false,
        };
      }
    }
  }
);

export const setBlockStyle = modify(
  (
    id: string[],
    blockI: number,
    prop: "alignment" | "lineHeight",
    value: string | number
  ) => {
    const doc = getComponentProp(id[0], "document") as ModelDocument;
    const block = doc.blocks[blockI];
    if (!block) return;
    block.style = { ...block.style, [prop]: value };
  }
);

export const applySelectionStyle = modify(
  (id: string[], sel: ModelSelection, style: Partial<BaseTextStyle>) => {
    const doc = getComponentProp(id[0], `document`) as ModelDocument;
    const { blocks } = doc;

    const { start, end } = isolateSelection(id[0], normaliseSelection(sel));

    if (style.alignment || style.lineHeight) {
      for (let i = start.blockI; i <= end.blockI; i++) {
        const blockStyle = (blocks[i].style ??= {});
        if (style.alignment) blockStyle.alignment = style.alignment;
        if (style.lineHeight) blockStyle.lineHeight = style.lineHeight;
      }
    }

    const rangeStart =
      start.charI > 0 ? { ...start, spanI: start.spanI + 1 } : start;
    for (const { span } of spanRange(blocks, { start: rangeStart, end })) {
      span.style = { ...span.style, ...style };
    }

    // needs normalisation to merge adjacent spans with the same style
    const newEnd = normaliseDocument(doc, end); // for this specific situation the start cursor would never move

    return { start, end: newEnd };
  }
);

// spans actually covered by a (raw, unsplit) selection range -- a cursor at
// a span boundary is normalised to the end of the preceding span (see
// normaliseCursor), so the first touched span is the *next* one whenever
// the start cursor sits exactly at such a boundary
function collectSelectedSpans(
  blocks: ModelBlock[],
  start: ModelCursor,
  end: ModelCursor
) {
  const spans: ModelSpan[] = [];

  for (let b = start.blockI; b <= end.blockI; b++) {
    const block = blocks[b];
    let startSpan = b === start.blockI ? start.spanI : 0;
    const endSpan = b === end.blockI ? end.spanI : block.spans.length - 1;

    if (
      b === start.blockI &&
      start.charI === block.spans[startSpan].text.length
    ) {
      startSpan++;
    }

    for (let s = startSpan; s <= endSpan; s++) spans.push(block.spans[s]);
  }

  return spans;
}

export function getStyleForSelection(id: string, sel: ModelSelection) {
  const doc = getComponentProp(id, "document") as ModelDocument;
  const { start, end } = sel;

  if (start == null) return squash(doc.style); // no selection

  if (end) {
    // full sel: when the whole selection shares one format (e.g. a
    // superscript/bold run that's been entirely highlighted), use that
    // format -- so typing over it keeps the formatting instead of
    // picking up whatever style happens to sit at either endpoint
    const normd = normaliseSelection(sel) as {
      start: ModelCursor;
      end: ModelCursor;
    };
    const spans = collectSelectedSpans(doc.blocks, normd.start, normd.end);
    const first = spans[0];
    const uniform =
      first && spans.every((s) => shallow(s.style ?? {}, first.style ?? {}));

    const block = doc.blocks[normd.end.blockI];
    const fallbackSpan = block.spans[normd.end.spanI];
    return squash(
      doc.style,
      block.style,
      (uniform ? first : fallbackSpan).style
    );
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

function blockText(block: ModelBlock) {
  return block.spans.map((s) => s.text).join("");
}

// flattens a document to plain text with block breaks as "\n", matching
// getDocumentText, so a whole-document diff naturally covers block
// splits/merges (Enter/Backspace) as well as in-line edits
export function flattenBlocks(blocks: ModelBlock[]) {
  return blocks.map(blockText).join("\n");
}

// converts a flat (block-break-inclusive) character offset into a cursor
export function offsetToCursor(
  blocks: ModelBlock[],
  offset: number
): ModelCursor {
  let remaining = offset;

  for (let blockI = 0; blockI < blocks.length; blockI++) {
    const spans = blocks[blockI].spans;
    const text = blockText(blocks[blockI]);
    const isLastBlock = blockI === blocks.length - 1;

    if (remaining <= text.length || isLastBlock) {
      let inBlock = Math.min(remaining, text.length);
      for (let spanI = 0; spanI < spans.length; spanI++) {
        const len = spans[spanI].text.length;
        const isLastSpan = spanI === spans.length - 1;
        if (inBlock <= len || isLastSpan) {
          return { blockI, spanI, charI: Math.min(inBlock, len) };
        }
        inBlock -= len;
      }
      return { blockI, spanI: 0, charI: 0 };
    }

    remaining -= text.length + 1; // +1 for the "\n" block break
  }

  return { blockI: 0, spanI: 0, charI: 0 };
}

// locates exactly which characters changed between two versions of a
// document, so undo/redo can jump the cursor/selection straight to the
// edit rather than an approximate/stale position. returns null when the
// text content is identical (e.g. a style-only change like bold/alignment,
// which still produces a history entry) since there's no text position to
// jump to -- without this, start/end both collapse to the end of the
// document and the cursor would jump there on every style toggle
export function findEditDiff(
  beforeBlocks: ModelBlock[],
  afterBlocks: ModelBlock[]
) {
  const bText = flattenBlocks(beforeBlocks);
  const aText = flattenBlocks(afterBlocks);

  if (bText === aText) return null;

  const maxPrefix = Math.min(bText.length, aText.length);
  let start = 0;
  while (start < maxPrefix && bText[start] === aText[start]) start++;

  const remaining = maxPrefix - start;
  let suffix = 0;
  while (
    suffix < remaining &&
    bText[bText.length - 1 - suffix] === aText[aText.length - 1 - suffix]
  ) {
    suffix++;
  }

  return { start, suffix };
}

// turns an edit diff into a selection within the given (post-undo/redo)
// document -- selects the text that reappeared, or collapses to a cursor
// where text disappeared
export function diffToSelection(
  targetBlocks: ModelBlock[],
  diff: { start: number; suffix: number }
): ModelSelection {
  const targetText = flattenBlocks(targetBlocks);
  const end = Math.max(diff.start, targetText.length - diff.suffix);

  return {
    start: offsetToCursor(targetBlocks, diff.start),
    end: end > diff.start ? offsetToCursor(targetBlocks, end) : null,
  };
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
      if (charI < span.text.length) {
        // within span
        charI++;
        amount--;
      } else if (spanI < block.spans.length - 1) {
        // at span boundary
        spanI++;
        charI = 1;
        amount--;
      } else if (blockI < blocks.length - 1) {
        // at block boundary
        blockI++;
        spanI = 0;
        charI = 0;
        amount--;
      } else {
        // end of container
        break;
      }
    } else {
      // moving left
      if (charI > 0) {
        // within span
        charI--;
        amount++;
      } else if (spanI > 0) {
        // at span boundary
        spanI--;
        charI = block.spans[spanI].text.length - 1;
        amount++;
      } else if (blockI > 0) {
        // at block boundary
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

function* spanRange(
  blocks: ModelBlock[],
  sel: { start: ModelCursor; end: ModelCursor }
) {
  const { start, end } = sel;
  for (let b = start.blockI; b <= end.blockI; b++) {
    const startSpan = b === start.blockI ? start.spanI : 0;
    const endSpan = b === end.blockI ? end.spanI : blocks[b].spans.length - 1;

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
  const blocks = getComponentProp(id, "document.blocks") as ModelBlock[];
  const end = splitSpan(blocks, sel.end!);

  const before = blocks[sel.start!.blockI].spans.length;
  const start = splitSpan(blocks, sel.start!);

  if (before !== blocks[start.blockI].spans.length) {
    // the starting span actually split
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
      }

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
  const blocks = getComponentProp(id, "document.blocks") as ModelBlock[];

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
  const doc = getComponentProp(id, "document") as ModelDocument;
  const { blocks } = doc;
  const { start, end } = normaliseSelection(sel) as {
    start: ModelCursor;
    end: ModelCursor;
  };

  // if the selection is single span
  if (start.blockI === end.blockI && start.spanI === end.spanI) {
    const block = blocks[start.blockI];
    const span = block.spans[start.spanI];
    const text = span.text.slice(start.charI, end.charI);
    const newDoc = {
      ...doc,
      blocks: [{ ...block, spans: [{ ...span, text }] }],
    };
    return { text, doc: newDoc };
  }

  let text = "";
  const newDoc = { ...doc, blocks: [] as ModelBlock[] };

  for (let b = start.blockI; b <= end.blockI; b++) {
    const startSpan = b === start.blockI ? start.spanI : 0;
    const endSpan = b === end.blockI ? end.spanI : blocks[b].spans.length - 1;

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

function squashSpanStyles(
  doc: ModelDocument,
  baseStyle: Partial<BaseTextStyle>
) {
  // pasted spans fully adopt the destination style — any formatting the
  // text had at copy time (font, color, etc.) is intentionally discarded
  doc.blocks.forEach((b) => {
    b.spans.forEach((s) => {
      s.style = { ...baseStyle };
    });
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

export const mergeDocs = modify(
  (id: string[], cursor: ModelCursor, doc: ModelDocument) => {
    const original = getComponentProp(id[0], "document") as ModelDocument;

    // pasted content should adopt the style of the text surrounding the
    // insertion point rather than the style it had when it was copied
    const baseStyle = getStyleForSelection(id[0], { start: cursor, end: null });
    const diff = objectDiff(baseStyle, squash(original.style));
    squashSpanStyles(doc, diff);

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
      const newBlock = { ...block, spans: [...finalBlock.spans, ...rhs] };
      original.blocks.splice(
        cursor.blockI + doc.blocks.length - 1,
        0,
        newBlock
      );

      const blockI = cursor.blockI + extreme.blockI;
      return { blockI, spanI: extreme.spanI, charI: extreme.charI };
    }
  }
);
