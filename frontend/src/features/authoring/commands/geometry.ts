import { componentBindingTargets } from "../../../components/Properties/componentBindings";
import type { Component, Scene } from "../types";
import { getRotatedCorners } from "../util";

// Where components are, as plain numbers. A component's bounds are a list of
// corner points; everything here is in terms of the box those points span
// (x and y are its top left), which is also how bindings and the editor's own
// inspector talk about position.

export interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Rectangular = Component & {
  bounds: { verts: { x: number; y: number }[] };
};

/** Audio components have no place on the canvas, so no bounds. */
export function hasFrame(component: Component): component is Rectangular {
  const verts = (component as { bounds?: { verts?: unknown[] } }).bounds?.verts;
  return Array.isArray(verts) && verts.length >= 2;
}

export function getFrame(component: Rectangular): Frame {
  const [a, b] = component.bounds.verts;
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}

export function getRotation(component: Component) {
  return (
    (component as { bounds?: { rotation?: number } }).bounds?.rotation ?? 0
  );
}

/**
 * The box a component covers on screen, rotation included. This is what
 * matters for "is it off the canvas" and "does it hit something".
 */
export function getVisualFrame(component: Rectangular): Frame {
  const rotation = getRotation(component);
  if (!rotation) return getFrame(component);

  const corners = getRotatedCorners({
    verts: component.bounds.verts,
    rotation,
  });
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

const target = (key: string) => {
  const found = componentBindingTargets.find((t) => t.key === key);
  if (!found) throw new Error(`no binding target "${key}"`);
  return found;
};

/**
 * Changes position and/or size in place. Uses the same maths as property
 * bindings, so speech bubble tails and lines scale properly too. Size is set
 * before position so the top left ends up where it was asked to be.
 */
export function setFrame(component: Component, frame: Partial<Frame>) {
  if (!hasFrame(component)) return;
  if (frame.width !== undefined) target("width").apply(component, frame.width);
  if (frame.height !== undefined)
    target("height").apply(component, frame.height);
  if (frame.x !== undefined) target("x").apply(component, frame.x);
  if (frame.y !== undefined) target("y").apply(component, frame.y);
}

/** Lines can't be rotated; everything else can. */
export function canRotate(component: Component) {
  return target("rotation").supports(component) as boolean;
}

export function setRotation(component: Component, degrees: number) {
  target("rotation").apply(component, degrees);
}

/** The box around several frames. */
export function unionFrame(frames: Frame[]): Frame {
  const x = Math.min(...frames.map((f) => f.x));
  const y = Math.min(...frames.map((f) => f.y));
  const right = Math.max(...frames.map((f) => f.x + f.width));
  const bottom = Math.max(...frames.map((f) => f.y + f.height));
  return { x, y, width: right - x, height: bottom - y };
}

export function intersectionArea(a: Frame, b: Frame) {
  const width = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return width > 0 && height > 0 ? width * height : 0;
}

/** Whether `outer` holds all of `inner`, give or take a pixel. */
export function contains(outer: Frame, inner: Frame, tolerance = 1) {
  return (
    inner.x >= outer.x - tolerance &&
    inner.y >= outer.y - tolerance &&
    inner.x + inner.width <= outer.x + outer.width + tolerance &&
    inner.y + inner.height <= outer.y + outer.height + tolerance
  );
}

/** Components with a place on the canvas, in the order they're drawn. */
export function framedComponents(scene: Scene) {
  return Object.values(scene.components)
    .filter(hasFrame)
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
}

export function round(value: number) {
  return Math.round(value);
}
