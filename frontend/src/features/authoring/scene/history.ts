import { fastIsEqual } from "fast-is-equal";
import type { Component, Scene } from "../types";
import { getComponent, getScene, getSceneId, setScene } from "./scene";
import { arrayToObject } from "./util";
import useVisualScene from "../stores/visual";
import { buildVisualComponent, buildVisualScene } from "../pipeline";
import useEditorStore from "../stores/editor";

interface SceneRef {
  _id: string;
  components: Record<string, any>[];
}

interface HistoryObject {
  sceneId: string;
  id: string;
  state: Component | null;
}

let undoStack: HistoryObject[] = [];
let redoStack: HistoryObject[] = [];
let scenes: SceneRef[] = [];
let scenarioId: string | null = null;
let saveScene: ((scene: Record<string, any>) => void) | null = null;

export function init(
  _scenes: SceneRef[],
  _scenarioId: string,
  _saveScene: (scene: Record<string, any>) => void
) {
  if (_scenarioId !== scenarioId) {
    undoStack = [];
    redoStack = [];
  }
  scenes = _scenes;
  scenarioId = _scenarioId;
  saveScene = _saveScene;
}

export function updateHistory(id: string, prevState: Component | null) {
  if (fastIsEqual(prevState, getComponent(id))) return;
  const sceneId = getSceneId();
  undoStack.push({ sceneId, id, state: prevState });
  redoStack = [];
}

export function undo() {
  const prev = undoStack.pop();
  if (!prev) return;
  switchToScene(prev.sceneId);
  const current = structuredClone(getComponent(prev.id));
  restoreComponent(prev.id, prev.state);
  redoStack.push({ sceneId: prev.sceneId, id: prev.id, state: current });
}

export function redo() {
  const entry = redoStack.pop();
  if (!entry) return;
  switchToScene(entry.sceneId);
  const current = structuredClone(getComponent(entry.id));
  restoreComponent(entry.id, entry.state);
  undoStack.push({ sceneId: entry.sceneId, id: entry.id, state: current });
}

function switchToScene(targetSceneId: string) {
  if (targetSceneId === getSceneId()) return;
  const targetScene = scenes.find((s) => s._id === targetSceneId);
  if (!targetScene) return;
  if (saveScene) saveScene(structuredClone(getScene()));
  const clone: Record<string, any> = structuredClone(targetScene);
  clone.components = arrayToObject(clone.components);
  setScene(clone as Scene);
  useVisualScene.getState().setVisualScene(buildVisualScene(clone as Scene));
  if (scenarioId)
    localStorage.setItem(`${scenarioId}:activeScene`, targetSceneId);
  useEditorStore.getState().clear();
}

function restoreComponent(id: string, state: Component | null) {
  if (state === null) {
    delete getScene().components[id];
    useVisualScene.getState().deleteComponent(id);
  } else {
    getScene().components[id] = structuredClone(state);
    useVisualScene.getState().updateComponent(buildVisualComponent(state));
  }
}
