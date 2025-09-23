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
    fill: "#00000000",
    strokeWidth: 0,
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 400, y: 100 }
      ],
      rotation: 0
    },
    document: {
      style: {},
      blocks: [
        {
          style: {},
          spans: [
            {
              style: {},
              text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla venenatis."
            }
          ],
        },
      ],
    },
  },
  line: {
    type: "line",
    stroke: "#b7b7b7ff",
    strokeWidth: 5,
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 100, y: 100 }
      ],
    }
  },
  speech: {
    type: "speech",
    fill: "#b7b7b7ff",
    strokeWidth: 0,
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 400, y: 100 },
        { x: 400, y: 120 }
      ],
      rotation: 0,
    }
  },
  box: {
    type: "box",
    clickable: true,
    fill: "#b7b7b7ff",
    strokeWidth: 0,
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 100, y: 100 }
      ],
      rotation: 0,
    }
  },
  ellipse: {
    type: "ellipse",
    fill: "#b7b7b7ff",
    clickable: true,
    strokeWidth: 0,
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 100, y: 100 }
      ],
      rotation: 0,
    }
  },
  image: {
    type: "image",
    clickable: true,
    preserveAspectRatio: "none",
    bounds: {
      verts: [
        { x: 0, y: 0 },
        { x: 100, y: 100 }
      ],
      rotation: 0,
    }
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

export function duplicateComponent(id: string) {
  const newComponent = structuredClone(getComponent(id));
  return parseComponent(newComponent);
}

export function createComponentFromBounds(type: keyof typeof defaults, bounds: Bounds) {
  const component = structuredClone(defaults[type]);
  const dims = mutate(subtract(bounds.verts[1], bounds.verts[0]), Math.abs);
  if (dims.x > 50 && dims.y > 50) component.bounds = bounds;
  return add(component);
}

export const modifyComponentProp = modify((id: string, prop: string, val: any) => {
  const component = getComponent(id);
  if (!component) return;

  console.log(component, prop, val);
  const [object, key] = getObject(prop, component);
  if (typeof val === "function") object[key] = val(object[key]);
  else if (typeof val === "object" && !Array.isArray(val))
    object[key] = merge(object[key], val);
  else object[key] = val;
});

export function modifyComponentBounds(id: string, bounds: Partial<Bounds>) {
  modifyComponentProp(id, "bounds", bounds);
}

export function bringForward(id: string) {
  modifyComponentProp(id, "zIndex", (val: number) => val + 1)
}

export function sendBackward(id: string) {
  modifyComponentProp(id, "zIndex", (val: number) => val - 1)
}

export function bringToFront(id: string) {
  const components = Object.values(getScene().components) as Component[];
  const max = components.reduce((p, c) => c.zIndex > p ? c.zIndex : p, -Infinity);
  if (getComponentProp(id, "zIndex") === max) return;
  modifyComponentProp(id, "zIndex", max + 1);
}

export function sendToBack(id: string) {
  const components = Object.values(getScene().components) as Component[];
  const min = components.reduce((p, c) => c.zIndex < p ? c.zIndex : p, Infinity);
  if (getComponentProp(id, "zIndex") === min) return;
  modifyComponentProp(id, "zIndex", min - 1);
}
