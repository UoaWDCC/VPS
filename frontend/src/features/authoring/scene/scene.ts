import { arrayToObject, getObject } from "./util";
import type { Component, SceneData } from "../types";
import useVisualScene from "../stores/visual";
import { buildVisualScene } from "../pipeline";
import useEditorStore from "../stores/editor";

let scene: SceneData = {} as SceneData;
let savedScene: SceneData = {} as SceneData;

(window as Window & { scene: SceneData }).scene = scene;

export function getScene() {
  return scene;
}

export function getSceneId() {
  return scene._id;
}

export function setScene(newScene: SceneData) {
  scene = newScene;
}

export function getComponent(id: string) {
  return scene.components[id] ?? null;
}

export function getComponentProp(id: string, prop: string): unknown {
  const component = scene.components[id];
  if (!component) return;
  const [object, key] = getObject(prop, component as unknown as Record<PropertyKey, unknown>);
  return object[key];
}

export function commitSavedScene() {
  savedScene = structuredClone(scene);
}

export async function saveCurrentScene(
  saveFn: (patch: ReturnType<typeof getScenePatch>) => Promise<void>
): Promise<void> {
  const patch = getScenePatch();
  if (
    Object.keys(patch.fields).length === 0 &&
    patch.components.length === 0 &&
    patch.deletedComponentIds.length === 0
  )
    return;
  await saveFn(patch);
  commitSavedScene();
}

export function applySceneSwitch(
  targetScene: SceneData,
  scenarioId: string
) {
  const clone = structuredClone(targetScene);
  clone.components = arrayToObject(clone.components as unknown as { id: string }[]) as Record<string, Component>;
  setScene(clone);
  commitSavedScene();
  useEditorStore.getState().clear();
  useVisualScene.getState().setVisualScene(buildVisualScene(clone));
  localStorage.setItem(`${scenarioId}:activeScene`, targetScene._id);
}

export function getScenePatch() {
  const components: Component[] = [];
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

  const fields: Record<string, unknown> = {};

  ["name", "roles", "time", "directLink", "timerStateOperations"].forEach(
    (field) => {
      const key = field as keyof SceneData;
      if (JSON.stringify(scene[key]) !== JSON.stringify(savedScene[key])) {
        fields[field] = structuredClone(scene[key]);
      }
    }
  );

  return {
    _id: scene._id,
    fields,
    components,
    deletedComponentIds,
  };
}
