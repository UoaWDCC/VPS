import { getObject } from "./util";

let scene = {} as any;
let scenes: Record<string, any>[] = [];
let sceneSaveRef: ((scene: Record<string, any>) => unknown) | null = null;
let scenarioId: string | null = null;

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

export function getScenes() {
  return scenes;
}

export function setScenes(newScenes: Record<string, any>[]) {
  scenes = newScenes;
}

export function getSceneSaveRef() {
  return sceneSaveRef;
}

export function setSceneSaveRef(
  newSceneSaveRef: ((scene: Record<string, any>) => unknown) | null
) {
  sceneSaveRef = newSceneSaveRef;
}

export function getScenarioId() {
  return scenarioId;
}

export function setScenarioId(id: string | null) {
  scenarioId = id;
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
