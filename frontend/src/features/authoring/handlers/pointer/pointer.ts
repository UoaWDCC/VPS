import { modifyComponentBounds } from "../../scene/operations/component";
import useEditorStore from "../../stores/editor";
import useVisualScene from "../../stores/visual";
import {
  getRelativePosition,
  parseHit,
  syncModelSelection,
} from "../../text/cursor";
import type { Vec2 } from "../../types";
import { subtract, translate } from "../../util";
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

  //! TEMPORARY
  if (!selected.includes(id)) {
    setSelected([...selected, id]);
  }

  // ! Text Selection Broken
  // ! Front back implementation
  // ! Resize
  // ! npm i --save-dev @types/uuid for another type
  // ! Object creation
  // ! MultiSelect rotation
  const component = scene[target.dataset.id as string];
  setMutationBounds({ ...component.bounds });

  setMode(["normal"]);
}

function handleComponentDrag(_: React.MouseEvent, position: Vec2) {
  const { selected, setMutationBounds, offset, setMode } =
    useEditorStore.getState();

  if (!selected || selected.length === 0) return;

  const [minX, minY, maxX, maxY] = getSelectedMinMaxXY();

  // Get Box Dimensions
  const initialGroupVerts = [
    { x: minX, y: minY },
    { x: maxX, y: maxY },
  ];

  // Translate the entire group box by the mouse movement offset
  const delta = subtract(position, offset);
  const verts = translate(initialGroupVerts, delta);

  let componentRotation =
    selected.length == 1 ? findComponentRotation(selected[0]) : 0;

  setMutationBounds({ verts, rotation: componentRotation });
  setMode(["mutation"]);
}

function handleMutationEnd() {
  const { selected, mutationBounds, setMode, mode } = useEditorStore.getState();

  const newVerts = mutationBounds.verts;

  const [minX, minY] = getSelectedMinMaxXY();

  const deltaVec = {
    x: newVerts[0].x - minX,
    y: newVerts[0].y - minY,
  };

  const origin = {
    x: minX,
    y: minY,
  };

  const scaleVec = getResizeScaleVec(newVerts);

  if (selected.length == 1) {
    modifyComponentBounds(selected, mutationBounds);
  } else {
    modifyComponentBounds(selected, (currentBounds) => {
      const updatedBounds = {
        ...currentBounds,
        verts: mode.includes("resize")
          ? getNewResizePosition(
              currentBounds.verts,
              newVerts,
              origin,
              scaleVec
            )
          : translate(currentBounds.verts, deltaVec),
      };

      return updatedBounds;
    });
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
  for (let i = 0; i < 2; i++) {
    const vert = verts[i];

    // Vert.var - origin.var is the distance from original top-left corner
    // This is then scaled based on change in size and is mapped to new top-left corner
    vert.x = newVerts[0].x + (vert.x - origin.x) * scaleVec.x;
    vert.y = newVerts[0].y + (vert.y - origin.y) * scaleVec.y;

    verts[i] = vert;
  }

  return verts;
}

function getSelectedMinMaxXY() {
  const { selected } = useEditorStore.getState();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const components = useVisualScene.getState().components;

  selected.forEach((id: string) => {
    const component = components[id];
    if (!component || !component.bounds || !component.bounds.verts) return;

    component.bounds.verts.forEach((obj: Vec2) => {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x);
      maxY = Math.max(maxY, obj.y);
    });
  });

  return [minX, minY, maxX, maxY];
}

function findComponentRotation(id: string) {
  const components = useVisualScene.getState().components;
  return components[id].bounds.rotation;
}

export function getSelectedComponentBounds() {
  const { selected } = useEditorStore.getState();
  const [minX, minY, maxX, maxY] = getSelectedMinMaxXY();
  const verts = [
    { x: minX, y: minY },
    { x: maxX, y: maxY },
  ];

  const componentRotation =
    selected.length === 1 ? findComponentRotation(selected[0]) : 0;

  const bounds = { verts, rotation: componentRotation, x: minX, y: minY };
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
  const { document: doc } = useVisualScene.getState().components[selected[0]];
  const cursor = parseHit(
    getRelativePosition(position, doc.bounds),
    doc.blocks
  );
  setVisualSelection((prev) => ({ start: prev.start, end: cursor }));
}
