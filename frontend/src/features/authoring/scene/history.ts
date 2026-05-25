import { fastIsEqual } from "fast-is-equal";
import type { Component } from "../types";
import {
  applySceneSwitch,
  getComponent,
  getScene,
  getSceneId,
  saveCurrentScene,
} from "./scene";
import useVisualScene from "../stores/visual";
import { buildVisualComponent } from "../pipeline";

interface SceneRef {
  _id: string;
  components: Record<string, any>[];
}

interface HistoryObject {
  sceneId: string;
  id: string;
  state: Component | null;
}

export interface ChangeRecord {
  id: string;
  prevState: Component | null;
}

let undoStack: HistoryObject[][] = [];
let redoStack: HistoryObject[][] = [];
let scenes: SceneRef[] = [];
let scenarioId: string | null = null;
let saveScene: ((patch: Record<string, any>) => Promise<void>) | null = null;

export function init(
  _scenes: SceneRef[],
  _scenarioId: string,
  _saveScene: (patch: Record<string, any>) => Promise<void>
) {
  if (_scenarioId !== scenarioId) {
    undoStack = [];
    redoStack = [];
  }
  scenes = _scenes;
  scenarioId = _scenarioId;
  saveScene = _saveScene;
}

export function updateHistory(incomingChanges: ChangeRecord[]) {
  const sceneId = getSceneId();
  let validChanges: HistoryObject[] = [];

  incomingChanges.forEach(({ id, prevState }) => {
    const currentState = getComponent(id);

    if (!fastIsEqual(prevState, currentState)) {
      validChanges.push({ sceneId, id, state: prevState });
    }
  });

  if (validChanges.length === 0) return;

  undoStack.push(validChanges);
  if (undoStack.length > 100) undoStack.shift();

  redoStack = [];
}

export function undo() {
  const batch = undoStack.pop();
  if (!batch || batch.length === 0) return;

  switchToScene(batch[0].sceneId);

  let redoChanges: HistoryObject[] = [];

  batch.forEach((prev) => {
    const current = getComponent(prev.id);
    const stateToSave = structuredClone(current);

    restoreComponent(prev.id, prev.state);
    redoChanges.push({
      sceneId: prev.sceneId,
      id: prev.id,
      state: stateToSave,
    });
  });

  redoStack.push(redoChanges);
}

export function redo() {
  const batch = redoStack.pop();
  if (!batch || batch.length === 0) return;

  switchToScene(batch[0].sceneId);

  let undoChanges: HistoryObject[] = [];

  batch.forEach((prev) => {
    const current = getComponent(prev.id);
    const stateToSave = structuredClone(current);

    restoreComponent(prev.id, prev.state);
    undoChanges.push({
      sceneId: prev.sceneId,
      id: prev.id,
      state: stateToSave,
    });
  });

  undoStack.push(undoChanges);
}

function switchToScene(targetSceneId: string) {
  if (targetSceneId === getSceneId()) return;
  const targetScene = scenes.find((s) => s._id === targetSceneId);
  if (!targetScene) return;
  if (saveScene) void saveCurrentScene(saveScene);
  applySceneSwitch(targetScene, scenarioId!);
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
