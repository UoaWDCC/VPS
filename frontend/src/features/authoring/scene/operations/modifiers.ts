import { v4 } from "uuid";
import { buildVisualComponent, buildVisualScene } from "../../pipeline";
import useVisualScene, { type VisualSceneState } from "../../stores/visual";
import { updateHistory, type ChangeRecord } from "../history";
import { commitSavedScene, getComponent, getScene, setScene } from "../scene";
import type { Component, Scene } from "../../types";
import { arrayToObject } from "../util";
import useEditorStore from "../../stores/editor";

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
export function modify<A extends [string[], ...any[]], R>(
  fn: (...args: A) => R
) {
  return function (...args: A): R {
    const ids = args[0];

    const previousStates: ChangeRecord[] = ids
      .map((id) => {
        const comp = getComponent(id);
        if (!comp) return null;
        return {
          id,
          prevState: structuredClone(comp),
        };
      })
      .filter((record): record is ChangeRecord => record !== null);

    const output = fn(...args);

    if (previousStates.length) updateHistory(previousStates);

    ids.forEach((id) => {
      const component = getComponent(id);
      if (component) {
        useVisualScene
          .getState()
          .updateComponent(buildVisualComponent(component));
      }
    });

    return output;
  };
}

export function remove(ids: string[], history = true) {
  const previousStates: ChangeRecord[] = ids.map((id) => {
    const comp = getComponent(id);
    return {
      id,
      prevState: structuredClone(comp),
    };
  });

  ids.forEach((id) => {
    delete getScene().components[id];
    useVisualScene.getState().deleteComponent(id);
  });

  if (history) updateHistory(previousStates);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function add(props: Record<string, any>, history = true) {
  if (!props.id) props.id = v4();
  const id = props.id as string;
  getScene().components[id] = props as Component;

  if (history) updateHistory([{ id: props.id, prevState: null }]);

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
