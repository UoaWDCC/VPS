import type { Bounds, Component, Vec2 } from "../../types";
import { getComponent, getScene } from "../scene";
import { mutate, subtract, translate } from "../../util";
import { getObject, merge } from "../util";
import { defaults } from "../defaults";
import {
  computeLayerChanges,
  type LayerDirection,
  type LayerMode,
} from "../layers";
import { add, modify } from "./modifiers";

// still exported from here for the code that already imports it
export { defaults };

export function stringifyComponent(id: string) {
  const component = getComponent(id);
  if (!component) return;
  return JSON.stringify(component);
}

export function parseComponent(
  component: Component,
  zIndex?: number,
  offset: Vec2 = { x: 10, y: 10 }
) {
  component.bounds.verts = translate(component.bounds.verts, offset);
  component.zIndex = zIndex ?? component.zIndex + 1;
  delete (component as Record<string, unknown>).id;
  return add(component);
}

export function getNextZIndex(components = getScene().components) {
  const zIndices = Object.values(components).map((c) => c.zIndex ?? 0);
  return zIndices.length ? Math.max(...zIndices) + 1 : 0;
}

export function duplicateComponent(ids: string[]) {
  // assign duplicates a zIndex above everything else, in the same relative
  // order as their originals, instead of each `zIndex + 1` independently —
  // that can collide with an adjacent original's zIndex and interleave the
  // duplicated group into the existing stack instead of keeping it together
  let nextZIndex = getNextZIndex();
  const sortedIds = [...ids].sort(
    (a, b) => (getComponent(a)?.zIndex ?? 0) - (getComponent(b)?.zIndex ?? 0)
  );

  return sortedIds
    .map((id: string) => {
      const newComponent = structuredClone(getComponent(id));
      if (!newComponent) return null;
      return parseComponent(newComponent, nextZIndex++);
    })
    .filter((id): id is string => id !== null);
}

export function createComponentFromBounds(
  type: keyof typeof defaults,
  bounds: Bounds
) {
  const component = structuredClone(defaults[type]);

  const dims = mutate(subtract(bounds.verts[1], bounds.verts[0]), Math.abs);

  if (dims.x > 50 && dims.y > 50) {
    component.bounds = bounds;
  } else {
    component.bounds.verts = translate(component.bounds.verts, bounds.verts[0]);
  }

  // Set zIndex above the current highest zIndex on the canvas
  const existingComponents = Object.values(getScene().components);
  const maxZIndex = existingComponents.length
    ? Math.max(...existingComponents.map((c) => c.zIndex))
    : -1;
  component.zIndex = maxZIndex + 1;

  return add(component);
}

export const modifyComponentProp = modify(
  (ids: string[], prop: string, val: unknown) => {
    ids.forEach((id) => {
      const component = getComponent(id);
      if (!component) return;

      const [object, key] = getObject(prop, component);

      if (typeof val === "function") {
        object[key] = (val as (prev: unknown) => unknown)(object[key]);
      } else if (
        val !== null &&
        typeof val === "object" &&
        !Array.isArray(val)
      ) {
        object[key] = merge(
          object[key] as Record<PropertyKey, unknown>,
          val as Record<PropertyKey, unknown>
        );
      } else {
        object[key] = val;
      }
    });
  }
);

export function modifyComponentBounds(
  ids: string[],
  bounds: Partial<Bounds> | ((prev: Bounds) => Bounds)
) {
  modifyComponentProp(ids, "bounds", bounds);
}

function shiftComponentLayers(
  ids: string[],
  direction: LayerDirection,
  mode: LayerMode
) {
  const changed = computeLayerChanges(
    Object.values(getScene().components),
    ids,
    direction,
    mode
  );

  if (changed.length) {
    applyZIndices(
      changed.map((c) => c.id),
      changed.map((c) => c.zIndex)
    );
  }
}

const applyZIndices = modify((ids: string[], zIndices: number[]) => {
  ids.forEach((id, index) => {
    const component = getComponent(id);
    if (!component) return;
    component.zIndex = zIndices[index];
  });
});

export function bringForward(ids: string[]) {
  shiftComponentLayers(ids, "forward", "step");
}

export function sendBackward(ids: string[]) {
  shiftComponentLayers(ids, "backward", "step");
}

export function bringToFront(ids: string[]) {
  shiftComponentLayers(ids, "forward", "extreme");
}

export function sendToBack(ids: string[]) {
  shiftComponentLayers(ids, "backward", "extreme");
}
