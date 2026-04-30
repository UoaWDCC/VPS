import { getObject } from "./util";

let scene = {} as any;

// @ts-ignore
window.scene = scene;

export function getScene() {
  return scene;
}

export function getSceneId() {
  return scene._id;
}

export function setScene(newScene: Record<string, any>) {
  scene = newScene as any;
}

export function getComponent(id: string) {
  return scene.components[id] ?? null;
}

export function getComponentProp(id: string, prop: string) {
  const component = scene.components[id];
  if (!component) return;
  const [object, key] = getObject(prop, component);
  return object[key];
}
