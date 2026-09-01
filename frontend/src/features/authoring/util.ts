import type { Bounds, RelativeBounds, Vec2 } from "./types";

type Degree = number;
type Radian = number;

function rad(angle: Degree) {
  return (angle / 360) * 2 * Math.PI;
}

export function deg(angle: Radian) {
  return (angle / (2 * Math.PI)) * 360;
}

export function add(v1: Vec2, v2: Vec2) {
  return { x: v1.x + v2.x, y: v1.y + v2.y };
}

export function addScalar(v1: Vec2, val: number) {
  return { x: v1.x + val, y: v1.y + val };
}

export function subtract(v1: Vec2, v2: Vec2) {
  return { x: v1.x - v2.x, y: v1.y - v2.y };
}

export function scale<T extends Vec2 | Vec2[]>(
  v: T,
  scale: number | Vec2,
  origin: Vec2 = { x: 0, y: 0 }
) {
  const scaleVec = typeof scale === "object" ? scale : { x: scale, y: scale };
  if (Array.isArray(v)) {
    return v.map((vec) =>
      add(multiply(subtract(vec, origin), scaleVec), origin)
    ) as T;
  } else {
    return add(multiply(subtract(v, origin), scaleVec), origin) as T;
  }
}

export function multiply(v1: Vec2, v2: Vec2) {
  return { x: v1.x * v2.x, y: v1.y * v2.y };
}

export function divide(v1: Vec2, v2: Vec2): Vec2 {
  return { x: v1.x / v2.x, y: v1.y / v2.y };
}

export function rotate(v: Vec2, origin: Vec2, angle: Degree) {
  if (!angle) return v;
  const relative = subtract(v, origin);
  const cos = Math.cos(rad(angle));
  const sin = Math.sin(rad(angle));
  return {
    x: cos * relative.x - sin * relative.y + origin.x,
    y: sin * relative.x + cos * relative.y + origin.y,
  };
}

export function rotateMany(verts: Vec2[], origin: Vec2, angle: Degree) {
  if (!angle) return verts;
  const cos = Math.cos(rad(angle));
  const sin = Math.sin(rad(angle));
  return verts.map((point) => {
    const relative = subtract(point, origin);
    return {
      x: cos * relative.x - sin * relative.y + origin.x,
      y: sin * relative.x + cos * relative.y + origin.y,
    };
  });
}

export function translate(verts: Vec2[], delta: Vec2) {
  return verts.map((vert) => add(vert, delta));
}

export function mutate(vert: Vec2, mutatation: (val: number) => number) {
  return { x: mutatation(vert.x), y: mutatation(vert.y) };
}

export function expandBoxVerts(verts: Vec2[]) {
  return [
    verts[0],
    { x: verts[1].x, y: verts[0].y },
    verts[1],
    { x: verts[0].x, y: verts[1].y },
  ];
}

export function getBoxCenter(verts: Vec2[]) {
  return {
    x: verts[0].x + (verts[1].x - verts[0].x) / 2,
    y: verts[0].y + (verts[1].y - verts[0].y) / 2,
  };
}

export function getRotatedCorners(bounds: Bounds) {
  return rotateMany(
    expandBoxVerts(bounds.verts),
    getBoxCenter(bounds.verts),
    bounds.rotation
  );
}

function normalize(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y);
  return len === 0 ? v : { x: v.x / len, y: v.y / len };
}

// outward normal of each edge of a convex polygon, in vertex order
function getEdgeNormals(verts: Vec2[]) {
  return verts.map((v, i) => {
    const next = verts[(i + 1) % verts.length];
    const edge = subtract(next, v);
    return normalize({ x: -edge.y, y: edge.x });
  });
}

function project(verts: Vec2[], axis: Vec2) {
  const dots = verts.map((v) => v.x * axis.x + v.y * axis.y);
  return [Math.min(...dots), Math.max(...dots)];
}

// separating axis theorem: two convex polygons intersect iff their
// projections overlap on every candidate axis (each polygon's edge normals)
export function polygonsIntersect(vertsA: Vec2[], vertsB: Vec2[]) {
  const axes = [...getEdgeNormals(vertsA), ...getEdgeNormals(vertsB)];
  return axes.every((axis) => {
    const [minA, maxA] = project(vertsA, axis);
    const [minB, maxB] = project(vertsB, axis);
    return minA <= maxB && minB <= maxA;
  });
}

export function getRelativeBounds(
  verts: Vec2[]
): Omit<RelativeBounds, "rotation"> {
  const minx = Math.min(verts[0].x, verts[1].x);
  const miny = Math.min(verts[0].y, verts[1].y);
  const dims = mutate(subtract(verts[1], verts[0]), Math.abs);

  return { x: minx, y: miny, width: dims.x, height: dims.y };
}

function lify(position: Vec2) {
  return `L${position.x} ${position.y}`;
}

export function constructPartialPath(verts: Vec2[]) {
  return verts.map(lify).join(" ");
}

export function constructPath(verts: Vec2[]) {
  const partial = constructPartialPath(verts);
  return "M" + partial.slice(1) + " Z";
}

export function clamp(value: Vec2, min: number, max: number) {
  return mutate(value, (val) => Math.max(Math.min(val, max), min));
}

export function clamp1(val: number, min: number, max: number) {
  return Math.max(Math.min(val, max), min);
}

export function expandToPath({
  x,
  y,
  width,
  height,
  rotation,
  origin,
}: RelativeBounds & { origin: Vec2 }) {
  let verts = [
    { x, y },
    { x: x + width, y: y + height },
  ];
  verts = rotateMany(expandBoxVerts(verts), origin, rotation);
  return constructPath(verts);
}

export function correct(verts: Vec2[], origin: Vec2, rotation: number) {
  if (!rotation) return verts;
  const newCenter = getBoxCenter(verts);
  const correction = subtract(rotate(newCenter, origin, rotation), newCenter);
  return translate(verts, correction);
}

export function objectDiff(
  a: Record<string, unknown>,
  b: Record<string, unknown>
) {
  const diff: Record<string, unknown> = {};
  for (const key in a) {
    if (!(key in b) || a[key] !== b[key]) {
      diff[key] = a[key];
    }
  }
  return diff;
}

export function filterComponent(component: Record<string, unknown>) {
  const filtered = {
    "data-id": component.id,
    strokeWidth: component.strokeWidth,
    stroke: component.stroke,
    fill: component.fill,
    preserveAspectRatio: component.preserveAspectRatio,
    href: component.href,
  };
  return filtered;
}
