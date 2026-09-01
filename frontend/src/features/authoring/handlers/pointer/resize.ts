import { getComponent } from "../../scene/scene";
import useEditorStore from "../../stores/editor";
import useVisualScene from "../../stores/visual";
import type { Bounds, Vec2 } from "../../types";
import {
  add,
  clamp,
  correct,
  deg,
  divide,
  getBoxCenter,
  multiply,
  rotate,
  scale,
  subtract,
} from "../../util";
import { getSelectedComponentBounds } from "./pointer";
import { snapResizePoint } from "./snap";

type HandleType = "size" | "rotation";
const BOX_CENTER_VALUE = 0.5;

let type: HandleType;
let coords: number[];

export function handleResizeStart(e: React.MouseEvent) {
  const { setMode } = useEditorStore.getState();

  const target = e.target as HTMLElement;
  type = target.dataset.type as HandleType;
  coords = target.dataset.coords!.split(",").map((s) => Number(s));

  setMode(["resize"]);
}

// exposes which handle is being dragged so callers (e.g. handleMutationEnd)
// can tell a rotation drag apart from a size drag, since both share the
// "resize" mode
export function getHandleType() {
  return type;
}

export function handleResizeDrag(e: React.MouseEvent, position: Vec2) {
  const { addMode, setMutationBounds, selected, setActiveGuides } =
    useEditorStore.getState();
  addMode("mutation");

  const bounds = getSelectedComponentBounds()!;

  const newBounds: Partial<Bounds> = {};

  if (type === "size") {
    const relative = rotate(
      position,
      getBoxCenter(bounds.verts),
      -bounds.rotation
    );

    // alignment guides only make sense in global space, so only snap unrotated components
    if (!bounds.rotation) {
      const components = Object.values(
        useVisualScene.getState().components
      ).filter((c) => c.type !== "audio" && !selected.includes(c.id));

      // resolve modifiers (shift/ctrl) against the raw point first so we snap the
      // actual resize point, not the mouse position they'd otherwise overwrite
      const unsnappedVerts = updateResize(
        relative,
        coords,
        e.ctrlKey,
        e.shiftKey
      );
      const draggedPoint = getVertPoint(unsnappedVerts, coords);
      const originalOpposite = getVertPoint(bounds.verts, inverse(coords));
      const pivot = getBoxCenter(bounds.verts);

      const snapped = snapResizePoint(
        draggedPoint,
        originalOpposite,
        pivot,
        coords,
        e.ctrlKey,
        components,
        ""
      );
      setActiveGuides(snapped.guides);

      newBounds.verts = updateResize(
        snapped.position,
        coords,
        e.ctrlKey,
        e.shiftKey
      );
    } else {
      setActiveGuides([]);
      newBounds.verts = updateResize(relative, coords, e.ctrlKey, e.shiftKey);
    }
  } else if (type === "rotation") {
    newBounds.rotation = getRotation(
      position,
      getBoxCenter(bounds.verts),
      e.shiftKey
    );
    setActiveGuides([]);
  }

  setMutationBounds((prev) => ({ ...prev, ...newBounds }));
}

function getRotation(v: Vec2, origin: Vec2, snap: boolean) {
  const relative = subtract(v, origin);
  const angle = deg(Math.atan2(relative.x, -relative.y));
  return snap ? Math.round(angle / 15) * 15 : angle;
}

// NOTE: potentially overcomplicated implementation
function getNewTail(verts: Vec2[], newVerts: Vec2[], coords: number[]) {
  const point = { x: 0, y: 0 };
  const inversePoint = { x: 0, y: 0 };
  const newPoint = { x: 0, y: 0 };

  if (coords[0] !== BOX_CENTER_VALUE) {
    point.x = verts[coords[0]].x;
    inversePoint.x = verts[1 - coords[0]].x;
    newPoint.x = newVerts[coords[0]].x;
  }

  if (coords[1] !== BOX_CENTER_VALUE) {
    point.y = verts[coords[1]].y;
    inversePoint.y = verts[1 - coords[1]].y;
    newPoint.y = newVerts[coords[1]].y;
  }

  const diff = subtract(newPoint, point);
  const ratio = divide(
    subtract(verts[2], inversePoint),
    subtract(point, inversePoint)
  );
  const scale = clamp(ratio, 0, 1);
  return add(verts[2], multiply(diff, scale));
}

function lockAspect(verts: Vec2[], newVerts: Vec2[], coords: number[]) {
  const inversePoint = { x: verts[1 - coords[0]].x, y: verts[1 - coords[1]].y };
  const newPoint = { x: newVerts[coords[0]].x, y: newVerts[coords[1]].y };

  const { x: dx, y: dy } = subtract(newPoint, inversePoint);
  const aspect = getAspect(verts);
  const width = Math.abs(verts[1].x - verts[0].x);
  const height = Math.abs(verts[1].y - verts[0].y);

  // compare movement relative to each axis's own size, not raw magnitude,
  // otherwise the axis with the larger original dimension always "wins"
  if (Math.abs(dx) * height >= Math.abs(dy) * width) {
    newVerts[coords[1]].y =
      inversePoint.y + Math.sign(dy) * (Math.abs(dx) / aspect);
  } else {
    newVerts[coords[0]].x =
      inversePoint.x + Math.sign(dx) * (Math.abs(dy) * aspect);
  }
}

function getAspect(verts: Vec2[]) {
  const width = Math.abs(verts[1].x - verts[0].x);
  const height = Math.abs(verts[1].y - verts[0].y);
  return width / height;
}

export function inverse(coords: number[]) {
  return [1 - coords[0], 1 - coords[1]];
}

function updateResize(
  position: Vec2,
  coords: number[],
  anchorCenter: boolean,
  fixed: boolean
) {
  const { selected } = useEditorStore.getState();
  const type = selected.length === 1 ? getComponent(selected[0]).type : "box";

  const bounds = getSelectedComponentBounds()!;
  const center = getBoxCenter(bounds.verts);

  let verts = modifyVerts(bounds.verts, coords, position);

  if (!coords.includes(2)) {
    // none of these apply to the speech triangle
    // hold shift to lock aspect ratio while resizing, except for images,
    // which lock aspect ratio by default and can be unlocked with shift
    const shouldLockAspect = type === "image" ? !fixed : fixed;
    if (shouldLockAspect && !coords.includes(BOX_CENTER_VALUE)) {
      lockAspect(bounds.verts, verts, coords);
    }

    if (type === "speech") {
      verts[2] = getNewTail(bounds.verts, verts, coords);
    }

    // alt modifier
    if (anchorCenter) {
      const mirrored = mirror(verts, center, coords);
      if (type === "speech") {
        mirrored[2] = getNewTail(verts, mirrored, inverse(coords));
      }
      verts = mirrored;
    }
  }

  return correct(verts, center, bounds.rotation);
}

function mirror(verts: Vec2[], center: Vec2, coords: number[]) {
  const point = { x: verts[coords[0]].x, y: verts[coords[1]].y };
  const inversePosition = add(scale(subtract(point, center), -1), center);
  return modifyVerts(verts, inverse(coords), inversePosition);
}

// extracts the position of the vertex being dragged, ignoring axes the
// current handle doesn't control (coords entry of 0.5)
function getVertPoint(verts: Vec2[], coords: number[]): Vec2 {
  return {
    x: coords[0] !== 0.5 ? verts[coords[0]].x : 0,
    y: coords[1] !== 0.5 ? verts[coords[1]].y : 0,
  };
}

function modifyVerts(verts: Vec2[], coords: number[], v: Vec2) {
  const newVerts = verts.map((v) => ({ ...v }));
  if (coords[1] !== BOX_CENTER_VALUE) newVerts[coords[1]].y = v.y;
  if (coords[0] !== BOX_CENTER_VALUE) newVerts[coords[0]].x = v.x;
  return newVerts;
}

export function getCoordsVec(verts: Vec2[], coords: number[]) {
  const center = getBoxCenter(verts);
  const x = coords[0] !== BOX_CENTER_VALUE ? verts[coords[0]].x : center.x;
  const y = coords[1] !== BOX_CENTER_VALUE ? verts[coords[1]].y : center.y;
  return { x, y };
}
