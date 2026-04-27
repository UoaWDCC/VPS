import { getObject } from "./util";

let scene = {} as any;
let savedScene = {} as any;

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

//Adds a saved baseline alongside the current scene, and use it to calculate a patch of changes when committing the scene
export function commitSavedScene() {
  savedScene = structuredClone(scene);
}

export function getScenePatch() {
  const components: any[] = [];
  const deletedComponentIds: string[] = [];

  const currentComponents = scene.components ?? {};
  const savedComponents = savedScene.components ?? {};

  Object.entries(currentComponents).forEach(([id, component]) => {
    if (JSON.stringify(component) !== JSON.stringify(savedComponents[id])) {
      components.push(structuredClone(component));
    }
  });

  Object.keys(savedComponents).forEach((id) => {
    if (!currentComponents[id]) deletedComponentIds.push(id);
  });

  const fields: Record<string, any> = {};

  ["name", "roles", "time"].forEach((field) => {
    if (JSON.stringify(scene[field]) !== JSON.stringify(savedScene[field])) {
      fields[field] = structuredClone(scene[field]);
    }
  });

  return {
    _id: scene._id,
    fields,
    components,
    deletedComponentIds,
  };
}