import { render } from "../../../../components/ContextMenu/portal";
import { modifyComponentBounds } from "../../scene/operations/component";
import { getComponent } from "../../scene/scene";
import useEditorStore from "../../stores/editor";
import useVisualScene from "../../stores/visual";
import {
  getRelativePosition,
  parseHit,
  syncModelSelection,
} from "../../text/cursor";
import type { Vec2 } from "../../types";
import { subtract, translate } from "../../util";
import ComponentMenu from "./ComponentContext";
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
  if (!selected.includes(id)) {
    setSelected([...selected, id]);
  }

  const component = scene[target.dataset.id as string];
  setMutationBounds({ ...component.bounds });

  setMode(["normal"]);
}

function findMaxSelectedMinXY() {
  const { selected } = useEditorStore.getState();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const components = useVisualScene.getState().components;

  selected.forEach((id: string) => {
    const component = components[id];
    if (!component || !component.bounds || !component.bounds.verts) return;

    component.bounds.verts.forEach((obj) => {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x);
      maxY = Math.max(maxY, obj.y);
    });
  });

  return [minX, minY, maxX, maxY];
}

function handleComponentDrag(_: React.MouseEvent, position: Vec2) {
  const { selected, setMutationBounds, offset, setMode } =
    useEditorStore.getState();

  if (!selected || selected.length === 0) return;

  const [minX, minY, maxX, maxY] = findMaxSelectedMinXY();

  const initialGroupVerts = [
    { x: minX, y: minY },
    { x: maxX, y: maxY },
  ];

  // 2. Translate the entire group box by the mouse movement offset
  const delta = subtract(position, offset);
  const verts = translate(initialGroupVerts, delta);

  setMutationBounds({ verts, rotation: 0 });
  setMode(["mutation"]);
}

function handleMutationEnd() {
  const { selected, mutationBounds, setMode } = useEditorStore.getState();

  if (selected && selected.length > 0 && mutationBounds?.verts) {
    const [minX, minY, maxX, maxY] = findMaxSelectedMinXY();

    const newVerts = mutationBounds.verts;
    const deltaVec = {
      x: newVerts[0].x - minX,
      y: newVerts[0].y - minY,
    };

    modifyComponentBounds(selected, (currentBounds) => {
      const updatedBounds = {
        ...currentBounds,
        verts: translate(currentBounds.verts, deltaVec),
      };

      if (typeof currentBounds.x === "number") {
        updatedBounds.x = currentBounds.x + deltaVec.x;
      }
      if (typeof currentBounds.y === "number") {
        updatedBounds.y = currentBounds.y + deltaVec.y;
      }
      //
      return updatedBounds;
    });
  }

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
