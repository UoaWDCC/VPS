import { modifyComponentBounds } from "../../scene/operations/component";
import useEditorStore from "../../stores/editor";
import useVisualScene from "../../stores/visual";
import {
  getRelativePosition,
  moveCursorVisual,
  parseHit,
  syncModelSelection,
} from "../../text/cursor";
import type { Vec2 } from "../../types";
import type {
  VisualBlock,
  VisualCursor,
  VisualDocument,
} from "../../text/types";
import { subtract, translate } from "../../util";
import { handleCreateDrag, handleCreateEnd, handleCreateStart } from "./create";
import { handleResizeDrag, handleResizeStart } from "./resize";
import { snapTranslation } from "./snap";
import { handleSelectAll } from "../keyboard/text";

export function handleMouseDownGlobal(e: React.MouseEvent, position: Vec2) {
  const target = e.target as HTMLElement;

  const { mode, setVisualSelection, setSelection } = useEditorStore.getState();

  if (mode.includes("create")) {
    handleCreateStart(e, position);
  } else if (target.dataset.handle) {
    handleResizeStart(e);
  } else if (target.dataset.type === "document") {
    handleDocumentClick(e, position);
  } else if (target.dataset.id) {
    handleComponentClick(e, position);
  } else {
    handleCanvasClick();
  }

  if (target.dataset.type !== "document") {
    setVisualSelection({ start: null, end: null });
    setSelection({ start: null, end: null });
  }

  useEditorStore.getState().setMouseDown(true);
}

export function handleMouseMoveGlobal(e: React.MouseEvent, position: Vec2) {
  const { mode, mouseDown } = useEditorStore.getState();

  if (!mouseDown) {
    handleComponentHover(e);
    return;
  }

  if (mode.includes("resize")) {
    handleResizeDrag(e, position);
  } else if (mode.includes("text")) {
    handleTextSelection(e, position);
  } else if (mode.includes("create")) {
    handleCreateDrag(e, position);
  } else {
    handleComponentDrag(e, position);
  }
}

export function handleMouseUpGlobal() {
  const { mode, setMouseDown } = useEditorStore.getState();

  if (mode.includes("text")) {
    syncModelSelection();
  } else if (mode.includes("create")) {
    handleCreateEnd();
  } else if (mode.includes("mutation")) {
    handleMutationEnd();
  }

  setMouseDown(false);
}

function handleCanvasClick() {
  const { setSelected, setMode } = useEditorStore.getState();
  setSelected(null);
  setMode(["normal"]);
}

// component handlers

function handleComponentHover(e: React.MouseEvent) {
  const { setHovered } = useEditorStore.getState();

  const target = e.target as HTMLElement;
  const id = target.dataset.id as string;

  setHovered(id ?? null);
}

function handleComponentClick(e: React.MouseEvent, position: Vec2) {
  const { setSelected, setOffset, setMode, setMutationBounds } =
    useEditorStore.getState();
  const scene = useVisualScene.getState().components;

  const target = e.target as HTMLElement;
  const id = target.dataset.id as string;

  setOffset(position);
  setSelected(id);

  const component = scene[target.dataset.id as string];
  setMutationBounds({ ...component.bounds });

  setMode(["normal"]);
}

function handleComponentDrag(_: React.MouseEvent, position: Vec2) {
  const { selected, setMutationBounds, offset, setMode, setActiveGuides } =
    useEditorStore.getState();
  if (!selected) return;

  const { components } = useVisualScene.getState();
  const component = components[selected];

  let verts = translate(component.bounds.verts, subtract(position, offset));
  const { delta, guides } = snapTranslation(
    verts,
    component.bounds.rotation,
    Object.values(components),
    selected
  );
  verts = translate(verts, delta);

  setMutationBounds((prev) => ({ ...prev, verts }));
  setActiveGuides(guides);
  setMode(["mutation"]);
}

function handleMutationEnd() {
  const { selected, mutationBounds, setMode, setActiveGuides } =
    useEditorStore.getState();
  modifyComponentBounds(selected!, mutationBounds);
  setMode(["normal"]);
  setActiveGuides([]);
}

// document handlers

function handleDocumentClick(e: React.MouseEvent, position: Vec2) {
  const {
    setSelected,
    setMode,
    setMutationBounds,
    setVisualSelection,
    setDesiredColumn,
  } = useEditorStore.getState();
  const scene = useVisualScene.getState().components;

  const target = e.target as HTMLElement;
  const id = target.dataset.id as string;
  const { document: doc } = useVisualScene.getState().components[
    id
  ] as unknown as { document: VisualDocument };
  const cursor = parseHit(
    getRelativePosition(position, doc.bounds),
    doc.blocks
  );

  setSelected(id);
  setMode(["text"]);

  const component = scene[id];
  setMutationBounds({ ...component.bounds });

  setDesiredColumn(null);

  // triple (or more) click selects the whole document, same as ctrl/cmd+a
  if (e.detail >= 3) {
    handleSelectAll(id);
    return;
  }

  // double click selects the word under the cursor
  if (e.detail === 2) {
    selectWordAtCursor(cursor, doc.blocks);
    return;
  }

  setVisualSelection({ start: cursor, end: null });
  syncModelSelection();
}

// \p{L}/\p{N} (rather than \w) so double-click word selection works for
// accented and non-Latin scripts, not just ASCII letters/digits
const WORD_CHAR = /[\p{L}\p{N}_']/u;

// the character immediately before (dir -1) or after (dir 1) a cursor,
// peeking into the adjacent span if the cursor sits at a span boundary
// (e.g. a word split across a style change). does not cross line/block
// boundaries, since those already fall on natural word breaks
function charAt(
  blocks: VisualBlock[],
  cursor: VisualCursor,
  dir: 1 | -1
): string | undefined {
  const line = blocks[cursor.blockI]?.lines[cursor.lineI];
  if (!line) return undefined;

  let spanI = cursor.spanI;
  let idx = dir === 1 ? cursor.charI : cursor.charI - 1;

  if (idx < 0) {
    if (spanI === 0) return undefined; // start of line
    spanI--;
    idx = line.spans[spanI].text.length - 1;
  } else if (idx >= line.spans[spanI].text.length) {
    if (spanI === line.spans.length - 1) return undefined; // end of line
    spanI++;
    idx = 0;
  }

  return line.spans[spanI].text[idx];
}

function isWordCharAt(
  blocks: VisualBlock[],
  cursor: VisualCursor,
  dir: 1 | -1
) {
  const char = charAt(blocks, cursor, dir);
  return char !== undefined && WORD_CHAR.test(char);
}

function sameVisualCursor(a: VisualCursor, b: VisualCursor) {
  return (
    a.blockI === b.blockI &&
    a.lineI === b.lineI &&
    a.spanI === b.spanI &&
    a.charI === b.charI
  );
}

// walks in one direction while the adjacent char is a word char. the
// sameVisualCursor check is just a safety net -- moveCursorVisual should
// always make progress here now, but a walk that trusted that blindly is
// exactly what caused the freeze this was built to fix in the first place
function walkWhileWord(
  blocks: VisualBlock[],
  cursor: VisualCursor,
  dir: 1 | -1
) {
  let pos = cursor;
  while (isWordCharAt(blocks, pos, dir)) {
    const next = moveCursorVisual(blocks, pos, dir);
    if (sameVisualCursor(next, pos)) break;
    pos = next;
  }
  return pos;
}

// selects the word touching the click position by walking the visual
// cursor left/right with moveCursorVisual -- clicking on a non-word
// character (whitespace/punctuation) selects just that one character
function selectWordAtCursor(cursor: VisualCursor, blocks: VisualBlock[]) {
  const { setVisualSelection } = useEditorStore.getState();

  if (!isWordCharAt(blocks, cursor, 1) && !isWordCharAt(blocks, cursor, -1)) {
    const hasRight = charAt(blocks, cursor, 1) !== undefined;
    setVisualSelection({
      start: hasRight ? cursor : moveCursorVisual(blocks, cursor, -1),
      end: hasRight ? moveCursorVisual(blocks, cursor, 1) : cursor,
    });
    syncModelSelection();
    return;
  }

  setVisualSelection({
    start: walkWhileWord(blocks, cursor, -1),
    end: walkWhileWord(blocks, cursor, 1),
  });
  syncModelSelection();
}

function handleTextSelection(_: React.MouseEvent, position: Vec2) {
  const { selected, setVisualSelection } = useEditorStore.getState();
  const { document: doc } = useVisualScene.getState().components[
    selected!
  ] as unknown as { document: VisualDocument };
  const cursor = parseHit(
    getRelativePosition(position, doc.bounds),
    doc.blocks
  );
  setVisualSelection((prev) => ({ start: prev.start, end: cursor }));
}
