import { v4 } from "uuid";
import { buildVisualComponent, buildVisualScene } from "../../pipeline";
import useVisualScene, { type VisualSceneState } from "../../stores/visual";
import { updateHistory } from "../history";
import { getComponent, getScene, setScene } from "../scene";
import type { Component, Scene } from "../../types";
import { arrayToObject } from "../util";

export function replace(scene: Record<string, any>) {
  const clone = structuredClone(scene);
  clone.components = arrayToObject(clone.components);
  setScene(clone as Scene);
  useVisualScene.getState().setVisualScene(buildVisualScene(clone as Scene));
}

export function modifySceneProp<K extends keyof VisualSceneState>(
  prop: K,
  value: VisualSceneState[K]
) {
  getScene()[prop] = value;
  useVisualScene.setState({ [prop]: value } as Partial<VisualSceneState>);
}

// wrapper for state mutating functions, will capture both state and operation
export function modify<A extends [string, ...any[]], R>(fn: (...args: A) => R) {
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

export function add(props: Record<string, any>, history = true) {
  if (!props.id) props.id = v4();
  getScene().components[props.id] = props;

  if (history) updateHistory(props.id, null);

  useVisualScene
    .getState()
    .updateComponent(buildVisualComponent(props as Component));

  return props.id;
}
