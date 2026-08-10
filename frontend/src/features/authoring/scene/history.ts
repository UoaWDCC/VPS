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
import useEditorStore from "../stores/editor";

interface SceneRef {
  _id: string;
  components: Record<string, any>[];
}

interface HistoryObject {
  sceneId: string;
  id: string;
  before: Component | null;
  after: Component | null;
}

type HistoryOperation = "do" | "undo" | "redo";

interface HistoryEventMap {
  update: HistoryEvent<HistoryOperation>;
}

class HistoryEvent<T extends HistoryOperation> extends Event {
  operation: T;
  record: T extends "undo" | "redo" ? HistoryObject : HistoryObject | undefined;

  constructor(
    operation: T,
    record: T extends "undo" | "redo"
      ? HistoryObject
      : HistoryObject | undefined
  ) {
    super("update");
    this.operation = operation;
    this.record = record;
  }
}

function cloneHistoryRecord(record: HistoryObject): HistoryObject {
  return {
    sceneId: record.sceneId,
    id: record.id,
    before: structuredClone(record.before),
    after: structuredClone(record.after),
  };
}

export interface ChangeRecord {
  id: string;
  prevState: Component | null;
}

type ActionHistory = "redo" | "undo";

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

  historyEvents.dispatchTypedEvent(
    "update",
    new HistoryEvent("do", cloneHistoryRecord(record))
  );
}

export function handleHistoryChange(action: ActionHistory) {
  const isUndo = action === "undo";
  const sourceStack = isUndo ? undoStack : redoStack;
  const targetStack = isUndo ? redoStack : undoStack;

  const batch = sourceStack.pop();
  if (!batch || batch.length === 0) return;

  const sceneID = batch[0].sceneId;
  const ids = batch.map((obj) => obj.id);

  if (!switchToScene(sceneID)) return;

  const validChanges: HistoryObject[] = ids.map((id) => {
    const comp = getComponent(id);
    return {
      sceneId: sceneID,
      id,
      state: comp ? structuredClone(comp) : null,
    };
  });

  batch.forEach((obj) => {
    restoreComponent(obj.id, obj.state);
  });

  targetStack.push(validChanges);
}

function switchToScene(targetSceneId: string): boolean {
  if (targetSceneId === getSceneId()) return true;
  const targetScene = scenes.find((s) => s._id === targetSceneId);
  if (!targetScene) return false;
  if (saveScene) void saveCurrentScene(saveScene);
  applySceneSwitch(targetScene, scenarioId!);
  return true;
}

function restoreComponent(id: string, state: Component | null) {
  const { setSelected } = useEditorStore.getState();
  if (state === null) {
    setSelected([]);
    delete getScene().components[id];
    useVisualScene.getState().deleteComponent(id);
  } else {
    getScene().components[id] = structuredClone(state);
    useVisualScene.getState().updateComponent(buildVisualComponent(state));
  }
}
