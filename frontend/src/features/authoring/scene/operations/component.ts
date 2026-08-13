import type { Bounds, Component } from "../../types";
import { getComponent, getScene } from "../scene";
import { mutate, subtract, translate } from "../../util";
import { getObject, merge } from "../util";
import { add, modify } from "./modifiers";

type LayerDirection = "forward" | "backward";
type LayerMode = "step" | "extreme";

export const defaults = {
  textbox: {
    type: "textbox",
    padding: 20,
    clickable: true,
    fill: "#00000000", // default value is rgba 0
    stroke: "#00000000",
    strokeWidth: 3, // default stroke width 3
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 400, y: 100 },
      ],
      rotation: 0,
    },
    document: {
      style: {},
      blocks: [
        {
          style: {},
          spans: [
            {
              style: {},
              text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla venenatis.",
            },
          ],
        },
      ],
    },
    zIndex: 0,
  },
  line: {
    type: "line",
    stroke: "#b7b7b7ff",
    strokeWidth: 5,
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
    },
    zIndex: 0,
  },
  speech: {
    type: "speech",
    fill: "#b7b7b7ff",
    stroke: "#00000000",
    strokewidth: 3,
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 400, y: 100 },
        { x: 400, y: 120 },
      ],
      rotation: 0,
    },
    zIndex: 0,
  },
  box: {
    type: "box",
    clickable: true,
    fill: "#b7b7b7ff",
    stroke: "#00000000",
    strokewidth: 3,
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      rotation: 0,
    },
    zIndex: 0,
  },
  ellipse: {
    type: "ellipse",
    fill: "#b7b7b7ff",
    clickable: true,
    stroke: "#00000000",
    strokewidth: 3,
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      rotation: 0,
    },
    zIndex: 0,
  },
  image: {
    type: "image",
    clickable: true,
    preserveAspectRatio: "none",
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 300, y: 300 },
      ],
      rotation: 0,
    },
    zIndex: 0,
  },
};

export function stringifyComponent(id: string) {
  const component = getComponent(id);
  if (!component) return;
  return JSON.stringify(component);
}

export function parseComponent(component: Component) {
  const offset = { x: 10, y: 10 };
  component.bounds.verts = translate(component.bounds.verts, offset);
  component.zIndex += 1;
  delete (component as Record<string, unknown>).id;
  return add(component);
}

export function duplicateComponent(ids: string[]) {
  return ids
    .map((id: string) => {
      const newComponent = structuredClone(getComponent(id));
      if (!newComponent) return null;
      return parseComponent(newComponent);
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
  if (!ids.length) return;

  const components = Object.values(getScene().components);
  const selectedIds = new Set(ids);

  // Sort components by zIndex (ascending) and capture the original zIndex scale
  const sortedComponents = [...components].sort((a, b) => a.zIndex - b.zIndex);
  const zIndexScale = sortedComponents.map((c) => c.zIndex);

  let newSortedComponents: Component[] = [];

  if (mode === "extreme") {
    // Bring to Front / Send to Back
    const selected = sortedComponents.filter((c) => selectedIds.has(c.id));
    const unselected = sortedComponents.filter((c) => !selectedIds.has(c.id));

    newSortedComponents =
      direction === "forward"
        ? [...unselected, ...selected] // Front: unselected first, then selected on top
        : [...selected, ...unselected]; // Back: selected on bottom, then unselected
  } else {
    // Bring Forward / Send Backward (Single step)
    newSortedComponents = [...sortedComponents];

    if (direction === "forward") {
      // Loop backward to move items up without overwriting consecutive selections
      for (let i = newSortedComponents.length - 1; i >= 0; i--) {
        if (
          selectedIds.has(newSortedComponents[i].id) &&
          i < newSortedComponents.length - 1 &&
          !selectedIds.has(newSortedComponents[i + 1].id)
        ) {
          const temp = newSortedComponents[i];
          newSortedComponents[i] = newSortedComponents[i + 1];
          newSortedComponents[i + 1] = temp;
        }
      }
    } else {
      // Loop forward to move items down
      for (let i = 0; i < newSortedComponents.length; i++) {
        if (
          selectedIds.has(newSortedComponents[i].id) &&
          i > 0 &&
          !selectedIds.has(newSortedComponents[i - 1].id)
        ) {
          const temp = newSortedComponents[i];
          newSortedComponents[i] = newSortedComponents[i - 1];
          newSortedComponents[i - 1] = temp;
        }
      }
    }
  }

  // Apply target zIndices back to modified components
  const changed = newSortedComponents
    .map((comp, index) => ({
      id: comp.id,
      targetZIndex: zIndexScale[index],
      zIndex: comp.zIndex,
    }))
    .filter(({ zIndex, targetZIndex }) => zIndex !== targetZIndex);

  if (changed.length) {
    applyZIndices(
      changed.map((c) => c.id),
      changed.map((c) => c.targetZIndex)
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
