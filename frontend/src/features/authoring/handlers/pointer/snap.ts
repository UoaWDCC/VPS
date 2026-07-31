import type { Bounds, Component, Guide, Vec2 } from "../../types";
import { expandBoxVerts, getBoxCenter, rotateMany } from "../../util";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../../../../util/canvas";

export const SNAP_THRESHOLD = 10;

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

function closestSnap(candidates: number[], targets: number[]) {
  let best: { delta: number; position: number } | null = null;
  for (const candidate of candidates) {
    for (const target of targets) {
      const delta = target - candidate;
      if (Math.abs(delta) > SNAP_THRESHOLD) continue;
      if (!best || Math.abs(delta) < Math.abs(best.delta)) {
        best = { delta, position: target };
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

  const xSnap = closestSnap([box.minX, box.centerX, box.maxX], xs);
  const ySnap = closestSnap([box.minY, box.centerY, box.maxY], ys);

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

// snaps a single resize handle point to nearby edges/centers; only meaningful for
// unrotated components, since the point is expressed in the component's local space
export function snapResizePoint(
  position: Vec2,
  coords: number[],
  components: Component[],
  excludeId: string
): { position: Vec2; guides: Guide[] } {
  const { xs, ys } = collectSnapTargets(components, excludeId);
  const guides: Guide[] = [];
  const snapped = { ...position };

  if (coords[0] !== 0.5) {
    const snap = closestSnap([position.x], xs);
    if (snap) {
      snapped.x = snap.position;
      guides.push({
        orientation: "vertical",
        position: snap.position,
        isCanvasCenter: snap.position === CANVAS_WIDTH / 2,
      });
    }
  }

  if (coords[1] !== 0.5) {
    const snap = closestSnap([position.y], ys);
    if (snap) {
      snapped.y = snap.position;
      guides.push({
        orientation: "horizontal",
        position: snap.position,
        isCanvasCenter: snap.position === CANVAS_HEIGHT / 2,
      });
    }
  }

  return { position: snapped, guides };
}
