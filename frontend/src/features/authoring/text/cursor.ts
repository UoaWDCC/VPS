import useEditorStore from "../stores/editor";
import useVisualScene from "../stores/visual";
import type { RelativeBounds, Vec2 } from "../types";
import { rotate, subtract } from "../util";
import type {
  ModelCursor,
  ModelSelection,
  VisualBlock,
  VisualCursor,
  VisualLine,
  VisualSelection,
  VisualSpan,
} from "./types";

export function scanDocument(blocks: VisualBlock[], y: number) {
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (y <= block.y + block.height) return i;
  }
  return blocks.length - 1;
}

export function scanBlock(block: VisualBlock, y: number) {
  for (let i = 0; i < block.lines.length; i++) {
    const line = block.lines[i];
    if (y - block.y < line.height + line.y) return i;
  }
  return block.lines.length - 1;
}

export function scanLine(line: VisualLine, x: number) {
  for (let i = 0; i < line.spans.length; i++) {
    const span = line.spans[i];
    if (x < span.width + span.x + line.x) return i;
  }
  return line.spans.length - 1;
}

export function scanSpan(span: VisualSpan, x: number) {
  for (let i = 0; i < span.charOffsets.length; i++) {
    const offset = (span.charOffsets[i] + span.charOffsets[i + 1]) / 2;
    if (offset > x - span.x) return i;
  }
  return span.text.length;
}

function toModel(cursor: VisualCursor | null, blocks: VisualBlock[]) {
  if (cursor == null) return null;
  const visualBlock = blocks[cursor.blockI];
  const visualLine = visualBlock?.lines[cursor.lineI];
  const visualSpan = visualLine?.spans[cursor.spanI];
  if (!visualSpan) return null;

  // normalisation (handle case where a model span boundary exists at a visual line boundary)
  let spanI = visualSpan.parentId;
  let charI = visualSpan.startIndex + cursor.charI;
  if (charI === 0 && spanI > 0) {
    spanI--;
    const prevLine = visualBlock.lines[cursor.lineI - 1];
    const prevSpan = prevLine.spans[prevLine.spans.length - 1];
    charI = prevSpan.startIndex + prevSpan.text.length;
  }

  return { blockI: cursor.blockI, spanI, charI };
}

export function toVisual(cursor: ModelCursor | null, blocks: VisualBlock[]) {
  if (cursor == null) return null;
  const visualBlock = blocks[cursor.blockI];
  for (let i = 0; i < visualBlock?.lines.length; i++) {
    const line = visualBlock?.lines[i];
    for (let j = 0; j < line.spans.length; j++) {
      const span = line.spans[j];
      if (span.parentId === cursor.spanI) {
        if (
          cursor.charI >= span.startIndex &&
          cursor.charI - span.startIndex <= span.text.length
        ) {
          const newCursor = {
            blockI: cursor.blockI,
            lineI: i,
            spanI: j,
            charI: cursor.charI - span.startIndex,
          };
          return normaliseVisualCursor(newCursor, blocks);
        }
      }
    }
  }
  return null;
}

export function toModelSelection(selection: VisualSelection, blocks: VisualBlock[]) {
  return {
    start: toModel(selection.start, blocks),
    end: toModel(selection.end, blocks),
  };
}


export function toVisualSelection(selection: ModelSelection, blocks: VisualBlock[]) {
  return {
    start: toVisual(selection.start, blocks),
    end: toVisual(selection.end, blocks),
  };
}

export function syncModelSelection() {
  const editorState = useEditorStore.getState();
  if (!editorState.selected || !editorState.visualSelection.start) return;
  const blocks = useVisualScene.getState().components[editorState.selected].document.blocks;
  editorState.setSelection(toModelSelection(editorState.visualSelection, blocks))
}

export function syncVisualCursor() {
  const editorState = useEditorStore.getState();
  if (!editorState.selected || !editorState.selection.start) return;
  const blocks = useVisualScene.getState().components[editorState.selected].document.blocks;
  editorState.setVisualSelection(toVisualSelection(editorState.selection, blocks));
}

// force cursor at line extreme to wrap to the start of the next line (more intuitive)
export function normaliseVisualCursor(
  cursor: VisualCursor,
  blocks: VisualBlock[],
) {
  const block = blocks[cursor.blockI];
  const line = block.lines[cursor.lineI];
  if (cursor.lineI < block.lines.length - 1) {
    if (
      cursor.spanI === line.spans.length - 1 &&
      cursor.charI === line.spans[cursor.spanI].text.length
    ) {
      return {
        blockI: cursor.blockI,
        lineI: cursor.lineI + 1,
        spanI: 0,
        charI: 0,
      };
    }
  }
  return cursor;
}

export function getRelativePosition(pos: Vec2, bounds: RelativeBounds) {
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  return subtract(rotate(pos, center, -bounds.rotation), bounds);
}

export function parseHit(pos: Vec2, blocks: VisualBlock[]): VisualCursor {
  const blockI = scanDocument(blocks, pos.y);
  const block = blocks[blockI];
  const lineI = scanBlock(block, pos.y);
  const line = block.lines[lineI];
  let spanI = scanLine(line, pos.x);
  let charI = scanSpan(line.spans[spanI], pos.x - line.x);

  // normalisation (force a cursor at span start to prev span end, excluding first line spans)
  if (charI === 0 && spanI > 0) {
    const prevSpan = line.spans[spanI - 1];
    charI = prevSpan.text.length;
    spanI--;
  }

  return { blockI, lineI, spanI, charI };
}

export function getVisualPosition(cursor: VisualCursor, blocks: VisualBlock[]) {
  const block = blocks[cursor.blockI];
  const line = block?.lines[cursor.lineI];
  const span = line?.spans[cursor.spanI];

  if (!span) return null;

  const x = line.x + span.x + span.charOffsets[cursor.charI];
  const y = block.y + line.y;

  return { x, y };
}

export function goToLineStart(cursor: VisualCursor) {
  cursor.spanI = 0;
  cursor.charI = 0;
  return cursor;
}

export function goToLineEnd(cursor: VisualCursor, blocks: VisualBlock[]) {
  const block = blocks[cursor.blockI];
  const line = block.lines[cursor.lineI];
  cursor.spanI = line.spans.length - 1;
  const span = line.spans[cursor.spanI];
  const isFinalSpan =
    cursor.spanI === line.spans.length - 1 &&
    cursor.lineI === block.lines.length - 1;
  cursor.charI = isFinalSpan ? span.text.length : span.text.length - 1;
  return cursor;
}

export function moveCursorLine(
  cursor: VisualCursor,
  desiredX: number,
  blocks: VisualBlock[],
  direction: -1 | 1,
) {
  let { blockI, lineI } = cursor;

  if (direction === 1) {
    if (lineI > 0) {
      lineI--;
    } else if (blockI > 0) {
      blockI--;
      lineI = blocks[blockI].lines.length - 1;
    } else return null; // already at top
  } else {
    if (lineI < blocks[blockI].lines.length - 1) {
      lineI++;
    } else if (blockI < blocks.length - 1) {
      blockI++;
      lineI = 0;
    } else return null; // already at bottom
  }

  const block = blocks[blockI];
  const line = block.lines[lineI];
  const spanI = scanLine(line, desiredX);
  const span = line.spans[spanI];
  const charI = scanSpan(span, desiredX - line.x);

  return { blockI, lineI, spanI, charI };
}

function isEndBeforeStartVisual(start: VisualCursor, end: VisualCursor) {
  if (end.blockI !== start.blockI) return end.blockI < start.blockI;
  if (end.lineI !== start.lineI) return end.lineI < start.lineI;
  if (end.spanI !== start.spanI) return end.spanI < start.spanI;
  return end.charI < start.charI;
}

export function normalizeSelectionVisual(selection: VisualSelection) {
  let { start, end } = selection;
  if (start && end && isEndBeforeStartVisual(start, end))
    [start, end] = [end, start];
  return { start, end };
}

export function moveCursorVisual(
  blocks: VisualBlock[],
  pos: VisualCursor | null,
  amount: number,
) {
  if (pos == null) return { blockI: 0, spanI: 0, lineI: 0, charI: 0 };

  let { blockI, spanI, lineI, charI } = normaliseVisualCursor(pos, blocks);

  while (amount !== 0) {
    const block = blocks[blockI];
    const line = block.lines[lineI];
    const span = line.spans[spanI];

    if (amount > 0) {
      // moving right
      if (
        charI <
        (spanI === line.spans.length - 1 && lineI < block.lines.length - 1
          ? span.text.length - 1
          : span.text.length)
      ) {
        charI++;
        amount--;
      } else if (spanI < line.spans.length - 1 && !(spanI === line.spans.length - 2 && line.spans[spanI + 1].text.length === 1)) {
        spanI++;
        charI = 1;
        amount--;
      } else if (lineI < block.lines.length - 1) {
        lineI++;
        spanI = 0;
        charI = 0;
        amount--;
      } else if (blockI < blocks.length - 1) {
        blockI++;
        lineI = 0;
        spanI = 0;
        charI = 0;
        amount--;
      } else {
        break; // end of container
      }
    } else {
      // moving left
      if (charI > (spanI === 0 ? 0 : 1)) {
        charI--;
        amount++;
      } else if (spanI > 0) {
        spanI--;
        charI = line.spans[spanI].text.length;
        amount++;
      } else if (lineI > 0) {
        lineI--;
        const line = block.lines[lineI];
        const span = line.spans[line.spans.length - 1];
        spanI = span.text.length > 1 ? line.spans.length - 1 : line.spans.length - 2;
        charI = span.text.length > 1 ? span.text.length - 1 : line.spans[spanI].text.length;
        amount++;
      } else if (blockI > 0) {
        blockI--;
        lineI = blocks[blockI].lines.length - 1;
        spanI = blocks[blockI].lines[lineI].spans.length - 1;
        charI = blocks[blockI].lines[lineI].spans[spanI].text.length;
        amount++;
      } else {
        break; // start of container
      }
    }
  }
  return { blockI, lineI, spanI, charI };
}
