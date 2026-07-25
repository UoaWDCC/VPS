import { modifyComponentBounds } from "../../scene/operations/component";
import useEditorStore from "../../stores/editor";
import useVisualScene from "../../stores/visual";
import {
  getRelativePosition,
  parseHit,
  syncModelSelection,
} from "../../text/cursor";
import type { Vec2 } from "../../types";
import {
  expandBoxVerts,
  getBoxCenter,
  rotate,
  rotateMany,
  subtract,
  translate,
} from "../../util";
import { handleCreateDrag, handleCreateEnd, handleCreateStart } from "./create";
import { handleResizeDrag, handleResizeStart } from "./resize";

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

  if (!mouseDown) return;

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
  setSelected([]);
  setMode(["normal"]);
}

// component handlers

function handleComponentClick(e: React.MouseEvent, position: Vec2) {
  const { selected, setSelected, setOffset, setMode, setMutationBounds } =
    useEditorStore.getState();
  const scene = useVisualScene.getState().components;

  const target = e.target as HTMLElement;
  const id = target.dataset.id as string;

  setOffset(position);

  let selectedSize = selected.length;

  //TODO: this is temporary
  if (!selected.includes(id)) {
    setSelected([...selected, id]);
    selectedSize += 1;
  }

  const { bounds } = scene[target.dataset.id as string];
  const rotation = selectedSize > 1 ? 0 : bounds.rotation;
  setMutationBounds({ ...bounds, rotation });

  setMode(["normal"]);
}

function handleComponentDrag(_: React.MouseEvent, position: Vec2) {
  const { selected, setMutationBounds, offset, setMode } =
    useEditorStore.getState();
  if (!selected?.length) return;

  const bounds = getSelectedComponentBounds();
  const verts = translate(bounds.verts, subtract(position, offset));

  setMutationBounds((prev) => ({ ...prev, verts }));
  setMode(["mutation"]);
}

function handleMutationEnd() {
  const { selected, mutationBounds, setMode, mode } = useEditorStore.getState();

  if (selected.length == 1) {
    modifyComponentBounds(selected, mutationBounds);
  } else {
    const verts = mutationBounds.verts;
    const [minX, minY] = getSelectedMinMaxXY();

    const origin = { x: minX, y: minY };
    const delta = { x: verts[0].x - minX, y: verts[0].y - minY };

    const scaleVec = getResizeScaleVec(verts);
    modifyComponentBounds(selected, (prev) => ({
      ...prev,
      verts: mode.includes("resize")
        ? getNewResizePosition(prev.verts, verts, origin, scaleVec)
        : translate(prev.verts, delta),
    }));
  }

  setMode(["normal"]);
}

// Component Helper Functions

function getResizeScaleVec(newVerts: Vec2[]) {
  const [minX, minY, maxX, maxY] = getSelectedMinMaxXY();

  const oldGroupWidth = maxX - minX;
  const oldGroupHeight = maxY - minY;

  const newGroupWidth = newVerts[1].x - newVerts[0].x;
  const newGroupHeight = newVerts[1].y - newVerts[0].y;

  const scaleX = oldGroupWidth === 0 ? 1 : newGroupWidth / oldGroupWidth;
  const scaleY = oldGroupHeight === 0 ? 1 : newGroupHeight / oldGroupHeight;

  return { x: scaleX, y: scaleY };
}

function getNewResizePosition(
  verts: Vec2[],
  newVerts: Vec2[],
  origin: Vec2,
  scaleVec: Vec2
) {
  const result: Vec2[] = [];
  for (let i = 0; i < 2; i++) {
    const vert = verts[i];
    result.push({
      x: newVerts[0].x + (vert.x - origin.x) * scaleVec.x,
      y: newVerts[0].y + (vert.y - origin.y) * scaleVec.y,
    });
  }
  if (verts[2]) result.push(verts[2]);
  return result;
}

function getSelectedMinMaxXY() {
  const { selected } = useEditorStore.getState();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const components = useVisualScene.getState().components;

  selected.forEach((id: string) => {
    const { bounds } = components[id];
    const { verts, rotation } = bounds;

    const rotated = rotateMany(
      expandBoxVerts(verts),
      getBoxCenter(verts),
      rotation
    );

    rotated.forEach((pos: Vec2) => {
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x);
      maxY = Math.max(maxY, pos.y);
    });
  });

  return [minX, minY, maxX, maxY];
}

export function getSelectedComponentBounds() {
  const { selected } = useEditorStore.getState();
  if (!selected?.length) return null;

  if (selected.length === 1) {
    const scene = useVisualScene.getState();
    return scene.components[selected[0]].bounds;
  }

  const [minX, minY, maxX, maxY] = getSelectedMinMaxXY();
  const verts = [
    { x: minX, y: minY },
    { x: maxX, y: maxY },
  ];

  const bounds = { verts, rotation: 0 };
  return bounds;
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
  const { document: doc } =
    useVisualScene.getState().components[target.dataset.id as string];
  const cursor = parseHit(
    getRelativePosition(position, doc.bounds),
    doc.blocks
  );

  setSelected([target.dataset.id as string]);
  setMode(["text"]);

  const component = scene[target.dataset.id as string];
  setMutationBounds({ ...component.bounds });

  setDesiredColumn(null);
  setVisualSelection({ start: cursor, end: null });
  syncModelSelection();
}

function handleTextSelection(_: React.MouseEvent, position: Vec2) {
  const { selected, setVisualSelection } = useEditorStore.getState();
  if (!selected?.length) return;

  const { document: doc } = useVisualScene.getState().components[selected[0]];
  const cursor = parseHit(
    getRelativePosition(position, doc.bounds),
    doc.blocks
  );

  setVisualSelection((prev) => ({ start: prev.start, end: cursor }));
}
