import { modifyComponentBounds } from "../../scene/operations/component";
import useEditorStore from "../../stores/editor";
import useVisualScene from "../../stores/visual";
import {
  getRelativePosition,
  parseHit,
  syncModelSelection,
} from "../../text/cursor";
import type { Component, Vec2 } from "../../types";
import {
  divide,
  expandBoxVerts,
  getBoxCenter,
  rotateMany,
  scale,
  subtract,
  translate,
} from "../../util";
import { handleCreateDrag, handleCreateEnd, handleCreateStart } from "./create";
import {
  getCoordsVec,
  handleResizeDrag,
  handleResizeStart,
  inverse,
} from "./resize";

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
  setSelected([]);
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
  const { selected, setMutationBounds, offset, setMode, setActiveGuides } =
    useEditorStore.getState();
  if (!selected?.length) return;

  const bounds = getSelectedComponentBounds();
  const verts = translate(bounds.verts, subtract(position, offset));

  setMutationBounds((prev) => ({ ...prev, verts }));
  setActiveGuides(guides);
  setMode(["mutation"]);
}

function handleMutationEnd() {
  const { selected, mutationBounds, setMode, mode } = useEditorStore.getState();

  if (selected.length == 1) {
    modifyComponentBounds(selected, mutationBounds);
  } else {
    const { verts: prevVerts } = getSelectedComponentBounds();
    const { verts } = mutationBounds;

    if (mode.includes("resize")) {
      const coords = detectChangedAxes(prevVerts, verts);
      const origin = getCoordsVec(prevVerts, inverse(coords));
      const scaleVec = divide(
        subtract(verts[0], verts[1]),
        subtract(prevVerts[0], prevVerts[1])
      );
      modifyComponentBounds(selected, ({ verts, rotation }) => {
        const rotated = rotateMany(verts, getBoxCenter(verts), rotation);
        const scaled = scale(rotated, scaleVec, origin);
        return {
          rotation,
          verts: rotateMany(scaled, getBoxCenter(scaled), -rotation),
        };
      });
    } else {
      const delta = subtract(verts[0], prevVerts[0]);
      modifyComponentBounds(selected, (prev) => ({
        ...prev,
        verts: translate(prev.verts, delta),
      }));
    }
  }

  setMode(["normal"]);
  setActiveGuides([]);
}

// Component Helper Functions

function resolveAxis(changed0: boolean, changed1: boolean) {
  if (changed0 && changed1) return 0.5;
  if (changed0) return 0;
  if (changed1) return 1;
  return 0.5;
}

function detectChangedAxes(a: Vec2[], b: Vec2[]) {
  const delta0 = { x: a[0].x !== b[0].x, y: a[0].y !== b[0].y };
  const delta1 = { x: a[1].x !== b[1].x, y: a[1].y !== b[1].y };
  return [resolveAxis(delta0.x, delta1.x), resolveAxis(delta0.y, delta1.y)];
}

function computeBounds(components: Component[]) {
  const min = { x: Infinity, y: Infinity };
  const max = { x: -Infinity, y: -Infinity };

  components.forEach((component) => {
    const { verts, rotation } = component.bounds;

    const rotated = rotateMany(
      expandBoxVerts(verts),
      getBoxCenter(verts),
      rotation
    );

    rotated.forEach((pos: Vec2) => {
      min.x = Math.min(min.x, pos.x);
      min.y = Math.min(min.y, pos.y);
      max.x = Math.max(max.x, pos.x);
      max.y = Math.max(max.y, pos.y);
    });
  });

  return [min, max];
}

export function getSelectedComponentBounds() {
  const { selected } = useEditorStore.getState();
  if (!selected?.length) return null;

  const scene = useVisualScene.getState();

  if (selected.length === 1) return scene.components[selected[0]].bounds;

  const components = selected.map((id) => scene.components[id]);
  return { verts: computeBounds(components), rotation: 0 };
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
  const { document: doc } = useVisualScene.getState().components[
    target.dataset.id as string
  ] as unknown as { document: VisualDocument };
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
