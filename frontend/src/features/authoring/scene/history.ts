import { fastIsEqual } from "fast-is-equal";
import type { Component } from "../types";
import { getComponent, getScene, getSceneId } from "./scene";
import { merge } from "./util";
import useVisualScene from "../stores/visual";
import { buildVisualComponent } from "../pipeline";
import { add, remove, replace } from "./operations/modifiers";
import useEditorStore from "../stores/editor";
import useAuthoringStore from "../stores/authoring";

interface HistoryObject {
  sceneId: string;
  id: string;
  state: Component | null;
}

let undoStack: HistoryObject[] = [];
let redoStack: HistoryObject[] = [];

export function updateHistory(id: string, prevState: Component | null) {
  if (fastIsEqual(prevState, getComponent(id))) return;
  const sceneId = getSceneId();
  undoStack.push({ sceneId, id, state: prevState });
  redoStack = redoStack.filter((entry) => entry.sceneId !== sceneId);
}

export function undo() {
  const prev = undoStack.pop();
  if (!prev) return;
  switchToHistoryScene(prev.sceneId);
  const current = structuredClone(getComponent(prev.id));
  if (current == null) add(prev.state!, false);
  else if (prev.state == null) remove(prev.id, false);
  else modifyComponent(prev.id, prev.state);
  redoStack.push({ sceneId: prev.sceneId, id: prev.id, state: current });
}

export function redo() {
  const subs = redoStack.pop();
  if (!subs) return;
  switchToHistoryScene(subs.sceneId);
  const current = structuredClone(getComponent(subs.id));
  if (current == null) add(subs.state!, false);
  else if (subs.state == null) remove(subs.id, false);
  else modifyComponent(subs.id, subs.state);
  undoStack.push({ sceneId: subs.sceneId, id: subs.id, state: current });
}

//ensure redo/undo applies to correct scene
function switchToHistoryScene(sceneId: string) {
  if (sceneId === getSceneId()) return;
  const nextScene = useAuthoringStore
    .getState()
    .scenes.find((scene) => scene._id === sceneId);
  if (!nextScene) return;

  //clones current scene and switches editor state
  const saveScene = useAuthoringStore.getState().sceneSaveRef;
  if (saveScene) saveScene(structuredClone(getScene()));
  replace(nextScene);
  const scenarioId = useAuthoringStore.getState().scenarioId;
  if (scenarioId) {
    localStorage.setItem(`${scenarioId}:activeScene`, sceneId);
  }

  useEditorStore.getState().clear();
}

function modifyComponent(id: string, props: Record<string, any>) {
  const component = getScene().components[id];
  if (!component) return;
  const newComponent = merge(component, props) as Component;
  getScene().components[id] = newComponent;
  useVisualScene.getState().updateComponent(buildVisualComponent(newComponent));
}
