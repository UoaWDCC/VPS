import { fastIsEqual } from "fast-is-equal";
import type { Component, SceneData } from "../types";
import {
  applySceneSwitch,
  getComponent,
  getScene,
  getSceneId,
  getScenePatch,
  saveCurrentScene,
} from "./scene";
import useVisualScene from "../stores/visual";
import { buildVisualComponent } from "../pipeline";
import useEditorStore from "../stores/editor";

type SceneRef = SceneData;

interface HistoryObject {
  sceneId: string;
  id: string;
  state: Component | null;
}

let undoStack: HistoryObject[] = [];
let redoStack: HistoryObject[] = [];
let scenes: SceneRef[] = [];
let scenarioId: string | null = null;
let saveScene: ((patch: ReturnType<typeof getScenePatch>) => Promise<void>) | null = null;

export function init(
  _scenes: SceneRef[],
  _scenarioId: string,
  _saveScene: (patch: ReturnType<typeof getScenePatch>) => Promise<void>
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
  if (undoStack.length > 100) undoStack.shift();
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
  if (saveScene) void saveCurrentScene(saveScene);
  applySceneSwitch(targetScene, scenarioId!);
}

function restoreComponent(id: string, state: Component | null) {
  const { setSelected } = useEditorStore.getState();
  if (state === null) {
    setSelected(null);
    delete getScene().components[id];
    useVisualScene.getState().deleteComponent(id);
  } else {
    getScene().components[id] = structuredClone(state);
    useVisualScene.getState().updateComponent(buildVisualComponent(state));
  }
}
