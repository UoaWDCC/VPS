import { v4 } from "uuid";
import { buildVisualComponent, buildVisualScene } from "../../pipeline";
import useVisualScene, { type VisualSceneState } from "../../stores/visual";
import { updateHistory } from "../history";
import { commitSavedScene, getComponent, getScene, setScene } from "../scene";
import type { Component, Scene, SceneData } from "../../types";
import { arrayToObject } from "../util";

export function replace(scene: SceneData) {
  const clone = structuredClone(scene);
  clone.components = arrayToObject(clone.components as unknown as { id: string }[]) as Record<string, Component>;
  setScene(clone);
  commitSavedScene();
  useVisualScene.getState().setVisualScene(buildVisualScene(clone as Scene));
}

export function modifySceneProp<K extends keyof VisualSceneState>(
  prop: K,
  value: VisualSceneState[K]
) {
  getScene()[prop as keyof SceneData] = value as SceneData[keyof SceneData];
  useVisualScene.setState({ [prop]: value } as Pick<VisualSceneState, K>);
}

// wrapper for state mutating functions, will capture both state and operation
export function modify<A extends [string, ...unknown[]], R>(fn: (...args: A) => R) {
  return function (...args: A): R {
    const id = args[0];
    const component = getComponent(id);

    const prev = structuredClone(component);
    const output = fn(...args);

    updateHistory(id, prev);

    useVisualScene.getState().updateComponent(buildVisualComponent(component));

    return output;
  };
}

export function remove(id: string, history = true) {
  const component = getComponent(id);
  const prev = structuredClone(component);

  delete getScene().components[id];

  if (history) updateHistory(id, prev);

  useVisualScene.getState().deleteComponent(id);
}

export function add(props: Record<string, unknown> & { id?: string }, history = true) {
  const id = props.id ?? v4();
  props.id = id;
  getScene().components[id] = props as Component;

  if (history) updateHistory(id, null);

  useVisualScene
    .getState()
    .updateComponent(buildVisualComponent(props as Component));

  return id;
}
