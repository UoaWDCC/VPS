import type { Bounds, Component } from "../../types";
import { getComponent, getComponentProp, getScene } from "../scene";
import { mutate, subtract, translate } from "../../util";
import { getObject, merge } from "../util";
import { add, modify } from "./modifiers";

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
  delete (component as Record<string, any>).id;
  return add(component);
}

export function duplicateComponent(ids: string[]) {
  return ids.map((id: string) => {
    const newComponent = structuredClone(getComponent(id));
    return parseComponent(newComponent);
  });
}

export function createComponentFromBounds(
  type: keyof typeof defaults,
  bounds: Bounds
) {
  const component = structuredClone(defaults[type]);
  const dims = mutate(subtract(bounds.verts[1], bounds.verts[0]), Math.abs);
  if (dims.x > 50 && dims.y > 50) component.bounds = bounds;

  // Set zIndex to the current number of components on the canvas
  const componentsCount = Object.keys(getScene().components).length;
  component.zIndex = componentsCount;
  return add(component);
}

export const modifyComponentProp = modify(
  (ids: string[], prop: string, val: any) => {
    ids.forEach((id) => {
      const component = getComponent(id);
      if (!component) return;

      const [object, key] = getObject(prop, component);

      if (typeof val === "function") object[key] = val(object[key]);
      else if (val !== null && typeof val === "object" && !Array.isArray(val))
        object[key] = merge(object[key], val);
      else object[key] = val;
    });
  }
);

export function modifyComponentBounds(
  ids: string[],
  bounds: Partial<Bounds> | ((prev: Bounds) => Bounds)
) {
  modifyComponentProp(ids, "bounds", bounds);
}

export function bringForward(ids: string[]) {
  if (!ids.length) return;

  const components = Object.values(getScene().components) as Component[];
  const selectedIds = new Set(ids);

  const sortedComponents = components.sort((a, b) => a.zIndex - b.zIndex);

  const zIndexScale = sortedComponents.map((c) => c.zIndex);

  for (let i = sortedComponents.length - 1; i >= 0; i--) {
    if (selectedIds.has(sortedComponents[i].id)) {
      if (
        i < sortedComponents.length - 1 &&
        !selectedIds.has(sortedComponents[i + 1].id)
      ) {
        const temp = sortedComponents[i];
        sortedComponents[i] = sortedComponents[i + 1];
        sortedComponents[i + 1] = temp;
      }
    }
  }

  sortedComponents.forEach((comp, index) => {
    const targetZIndex = zIndexScale[index];

    if (comp.zIndex !== targetZIndex) {
      modifyComponentProp([comp.id], "zIndex", targetZIndex);
    }
  });
}

export function sendBackward(ids: string[]) {
  if (!ids.length) return;

  const components = Object.values(getScene().components) as Component[];
  const selectedIds = new Set(ids);

  const sortedComponents = components.sort((a, b) => a.zIndex - b.zIndex);

  const zIndexScale = sortedComponents.map((c) => c.zIndex);

  for (let i = 0; i < sortedComponents.length; i++) {
    if (selectedIds.has(sortedComponents[i].id)) {
      if (i > 0 && !selectedIds.has(sortedComponents[i - 1].id)) {
        const temp = sortedComponents[i];
        sortedComponents[i] = sortedComponents[i - 1];
        sortedComponents[i - 1] = temp;
      }
    }
  }

  sortedComponents.forEach((comp, index) => {
    const targetZIndex = zIndexScale[index];

    if (comp.zIndex !== targetZIndex) {
      modifyComponentProp([comp.id], "zIndex", targetZIndex);
    }
  });
}
function moveComponentFrontAndBack(ids: string[], state: "front" | "back") {
  if (!ids.length) return;

  const components = Object.values(getScene().components) as Component[];
  const selectedIds = new Set(ids);

  const sortedComponents = components.sort((a, b) => a.zIndex - b.zIndex);
  const zIndexScale = sortedComponents.map((c) => c.zIndex);
  const selectedComponents = sortedComponents.filter((comp) =>
    selectedIds.has(comp.id)
  );
  const unselectedComponents = sortedComponents.filter(
    (comp) => !selectedIds.has(comp.id)
  );

  const newSortedComponents =
    state == "front"
      ? [...unselectedComponents, ...selectedComponents]
      : [...selectedComponents, ...unselectedComponents];

  newSortedComponents.forEach((comp, index) => {
    const targetZIndex = zIndexScale[index];

    if (comp.zIndex !== targetZIndex) {
      modifyComponentProp([comp.id], "zIndex", targetZIndex);
    }
  });
}

export function bringToFront(ids: string[]) {
  moveComponentFrontAndBack(ids, "front");
}

export function sendToBack(ids: string[]) {
  moveComponentFrontAndBack(ids, "back");
}
