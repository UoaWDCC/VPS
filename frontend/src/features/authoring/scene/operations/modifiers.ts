import { v4 } from "uuid";
import { buildVisualComponent, buildVisualScene } from "../../pipeline";
import useVisualScene, { type VisualSceneState } from "../../stores/visual";
import { dispatchModification, updateHistory } from "../history";
import { getComponent, getScene, setScene } from "../scene";
import type { Component, Scene } from "../../types";
import { arrayToObject } from "../util";

export function replace(scene: Scene) {
  const clone = structuredClone(scene);
  clone.components = arrayToObject(
    clone.components as unknown as { id: string }[]
  ) as Record<string, Component>;
  setScene(clone);
  useVisualScene.getState().setVisualScene(buildVisualScene(clone));
}

export function modifySceneProp<K extends keyof VisualSceneState>(
  prop: K,
  value: VisualSceneState[K]
) {
  (getScene() as unknown as Record<string, unknown>)[prop as string] = value;
  useVisualScene.setState({ [prop]: value } as Pick<VisualSceneState, K>);
  dispatchModification();
}

// wrapper for state mutating functions, will capture both state and operation
export function modify<A extends [string, ...unknown[]], R>(
  fn: (...args: A) => R
) {
  return function(...args: A): R | undefined {
    const id = args[0];
    const component = getComponent(id);
    if (!component) return undefined;

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function add(props: Record<string, any>, history = true) {
  if (!props.id) props.id = v4();
  const id = props.id as string;
  getScene().components[id] = props as Component;

  if (history) updateHistory(id, null);

  useVisualScene
    .getState()
    .updateComponent(buildVisualComponent(props as Component));

  return id;
}

export function replaceComponent(
  id: string,
  state: Component | null,
  history = false
) {
  if (state === null) remove(id, history);
  else add(state, history);
}
