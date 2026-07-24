import { getObject } from "./util";
import type { Scene } from "../types";

let scene: Scene = {} as Scene;

(window as unknown as Window & { scene: Scene }).scene = scene;

export function getScene() {
  return scene;
}

export function getSceneId() {
  return scene._id;
}

export function setScene(newScene: Scene) {
  scene = newScene;
}

export function getComponent(id: string) {
  return scene.components[id] ?? null;
}

export function getComponentProp(id: string, prop: string): unknown {
  const component = scene.components[id];
  if (!component) return;
  const [object, key] = getObject(
    prop,
    component as unknown as Record<PropertyKey, unknown>
  );
  return object[key];
}
