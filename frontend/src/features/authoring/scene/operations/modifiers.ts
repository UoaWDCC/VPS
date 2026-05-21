import { v4 } from "uuid";
import { buildVisualComponent, buildVisualScene } from "../../pipeline";
import useVisualScene, { type VisualSceneState } from "../../stores/visual";
import { updateHistory, type ChangeRecord } from "../history";
import { commitSavedScene, getComponent, getScene, setScene } from "../scene";
import type { Component, Scene } from "../../types";
import { arrayToObject } from "../util";

export function replace(scene: Record<string, any>) {
  const clone = structuredClone(scene);
  clone.components = arrayToObject(clone.components);
  setScene(clone as Scene);
  commitSavedScene();
  useVisualScene.getState().setVisualScene(buildVisualScene(clone as Scene));
}

export function modifySceneProp<K extends keyof VisualSceneState>(
  prop: K,
  value: VisualSceneState[K]
) {
  getScene()[prop] = value;
  useVisualScene.setState({ [prop]: value } as Pick<VisualSceneState, K>);
}

// wrapper for state mutating functions, will capture both state and operation
export function modify<A extends [string[], ...any[]], R>(
  fn: (...args: A) => R
) {
  return function (...args: A): R {
    const ids = args[0];

    const previousStates: ChangeRecord[] = ids.map((id) => {
      const comp = getComponent(id);
      return {
        id,
        prevState: comp ? structuredClone(comp) : null,
      };
    });

    const output = fn(...args);

    updateHistory(previousStates);

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
      prevState: comp ? structuredClone(comp) : null,
    };
  });

  ids.forEach((id) => {
    delete getScene().components[id];
    useVisualScene.getState().deleteComponent(id);
  });

  // ** IMPORTANT ** getComponents(ids[0]) is a place holder for prevState what does that do?
  if (history) updateHistory(previousStates);
}

export function add(props: Record<string, any>, history = true) {
  if (!props.id) props.id = v4();
  getScene().components[props.id] = props;

  if (history) updateHistory([{ id: props.id, prevState: null }]);

  useVisualScene
    .getState()
    .updateComponent(buildVisualComponent(props as Component));

  return props.id;
}
