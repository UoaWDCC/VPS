import { modifyComponentBounds } from "../../scene/operations/component";
import {
  cursorToOffset,
  findWordRange,
  flattenBlocks,
  offsetToCursor,
} from "../../scene/operations/text";
import { getComponentProp } from "../../scene/scene";
import useEditorStore from "../../stores/editor";
import useVisualScene from "../../stores/visual";
import {
  getRelativePosition,
  parseHit,
  syncModelSelection,
  syncVisualCursor,
} from "../../text/cursor";
import type { Vec2, ModelBlock } from "../../types";
import type { VisualDocument } from "../../text/types";
import { subtract, translate } from "../../util";
import { handleCreateDrag, handleCreateEnd, handleCreateStart } from "./create";
import { handleResizeDrag, handleResizeStart } from "./resize";
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
  const { selected, setMutationBounds, offset, setMode } =
    useEditorStore.getState();
  if (!selected) return;

  const component = useVisualScene.getState().components[selected];

  const verts = translate(component.bounds.verts, subtract(position, offset));
  setMutationBounds((prev) => ({ ...prev, verts }));
  setMode(["mutation"]);
}

function handleMutationEnd() {
  const { selected, mutationBounds, setMode } = useEditorStore.getState();
  modifyComponentBounds(selected!, mutationBounds);
  setMode(["normal"]);
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

  setVisualSelection({ start: cursor, end: null });
  syncModelSelection();

  // double click selects the word under the cursor
  if (e.detail === 2) selectWordAtCursor(id);
}

function selectWordAtCursor(id: string) {
  const { selection, setSelection } = useEditorStore.getState();
  if (!selection.start) return;

  const blocks = getComponentProp(id, "document.blocks") as ModelBlock[];
  const text = flattenBlocks(blocks);
  const offset = cursorToOffset(blocks, selection.start);

  const { start, end } = findWordRange(text, offset);
  if (end <= start) return;

  setSelection({
    start: offsetToCursor(blocks, start),
    end: offsetToCursor(blocks, end),
  });
  syncVisualCursor();
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
