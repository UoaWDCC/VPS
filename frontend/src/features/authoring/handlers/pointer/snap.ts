import type { Bounds, Component, Guide, Vec2 } from "../../types";
import { expandBoxVerts, getBoxCenter, rotateMany } from "../../util";

export const SNAP_THRESHOLD = 10;
export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

interface AABB {
  minX: number;
  maxX: number;
  centerX: number;
  minY: number;
  maxY: number;
  centerY: number;
}

function getAABB(bounds: Bounds): AABB {
  const corners = rotateMany(
    expandBoxVerts(bounds.verts),
    getBoxCenter(bounds.verts),
    bounds.rotation
  );
  const xs = corners.map((v) => v.x);
  const ys = corners.map((v) => v.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    minX,
    maxX,
    centerX: (minX + maxX) / 2,
    minY,
    maxY,
    centerY: (minY + maxY) / 2,
  };
}

function collectSnapTargets(components: Component[], excludeId: string) {
  const xs = [0, CANVAS_WIDTH / 2, CANVAS_WIDTH];
  const ys = [0, CANVAS_HEIGHT / 2, CANVAS_HEIGHT];

  for (const component of components) {
    if (component.id === excludeId) continue;
    const box = getAABB(component.bounds);
    xs.push(box.minX, box.centerX, box.maxX);
    ys.push(box.minY, box.centerY, box.maxY);
  }

  return { xs, ys };
}

// a point on the shape that can be dragged into alignment, and how fast it
// moves relative to the resize handle's input position (see snapResizePoint)
interface Candidate {
  value: number;
  rate: number;
}

function closestSnap(candidates: Candidate[], targets: number[]) {
  let best: { delta: number; position: number; rate: number } | null = null;
  for (const candidate of candidates) {
    for (const target of targets) {
      const delta = target - candidate.value;
      if (Math.abs(delta) > SNAP_THRESHOLD) continue;
      if (!best || Math.abs(delta) < Math.abs(best.delta)) {
        best = { delta, position: target, rate: candidate.rate };
      }
    }
  }
  return best;
}

// snaps a translated (dragged) bounding box to nearby edges/centers, independently per axis
export function snapTranslation(
  verts: Vec2[],
  rotation: number,
  components: Component[],
  excludeId: string
): { delta: Vec2; guides: Guide[] } {
  const box = getAABB({ verts, rotation });
  const { xs, ys } = collectSnapTargets(components, excludeId);

  // a plain translation moves every edge/center of the box at the same rate
  const asCandidates = (values: number[]): Candidate[] =>
    values.map((value) => ({ value, rate: 1 }));

  const xSnap = closestSnap(
    asCandidates([box.minX, box.centerX, box.maxX]),
    xs
  );
  const ySnap = closestSnap(
    asCandidates([box.minY, box.centerY, box.maxY]),
    ys
  );

  const guides: Guide[] = [];
  const delta: Vec2 = { x: 0, y: 0 };

  if (xSnap) {
    delta.x = xSnap.delta;
    guides.push({
      orientation: "vertical",
      position: xSnap.position,
      isCanvasCenter: xSnap.position === CANVAS_WIDTH / 2,
    });
  }
  if (ySnap) {
    delta.y = ySnap.delta;
    guides.push({
      orientation: "horizontal",
      position: ySnap.position,
      isCanvasCenter: ySnap.position === CANVAS_HEIGHT / 2,
    });
  }

  return { delta, guides };
}

// snaps a resize handle to nearby edges/centers; only meaningful for unrotated
// components, since points are expressed in the component's local space.
//
// A resize handle can move more than just the dragged corner: with ctrl held
// the opposite corner mirrors it (moving at rate -1), and even a plain drag
// shifts the box's center (rate 0.5, since only one of the two corners moves).
// Each of those is a separate point that could be the one lining up with
// another shape, so every one is checked, and the delta is converted back
// into a position adjustment using that candidate's rate of movement.
export function snapResizePoint(
  draggedPoint: Vec2,
  originalOpposite: Vec2,
  pivot: Vec2,
  coords: number[],
  anchorCenter: boolean,
  components: Component[],
  excludeId: string
): { position: Vec2; guides: Guide[] } {
  const { xs, ys } = collectSnapTargets(components, excludeId);
  const guides: Guide[] = [];
  const snapped = { ...draggedPoint };

  if (coords[0] !== 0.5) {
    const candidates: Candidate[] = anchorCenter
      ? [
          { value: draggedPoint.x, rate: 1 },
          { value: 2 * pivot.x - draggedPoint.x, rate: -1 },
        ]
      : [
          { value: draggedPoint.x, rate: 1 },
          { value: (draggedPoint.x + originalOpposite.x) / 2, rate: 0.5 },
        ];
    const snap = closestSnap(candidates, xs);
    if (snap) {
      snapped.x = draggedPoint.x + snap.delta / snap.rate;
      guides.push({
        orientation: "vertical",
        position: snap.position,
        isCanvasCenter: snap.position === CANVAS_WIDTH / 2,
      });
    }
  }

  if (coords[1] !== 0.5) {
    const candidates: Candidate[] = anchorCenter
      ? [
          { value: draggedPoint.y, rate: 1 },
          { value: 2 * pivot.y - draggedPoint.y, rate: -1 },
        ]
      : [
          { value: draggedPoint.y, rate: 1 },
          { value: (draggedPoint.y + originalOpposite.y) / 2, rate: 0.5 },
        ];
    const snap = closestSnap(candidates, ys);
    if (snap) {
      snapped.y = draggedPoint.y + snap.delta / snap.rate;
      guides.push({
        orientation: "horizontal",
        position: snap.position,
        isCanvasCenter: snap.position === CANVAS_HEIGHT / 2,
      });
    }
  }

  return { position: snapped, guides };
}
