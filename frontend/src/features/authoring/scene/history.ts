import { fastIsEqual } from "fast-is-equal";
import type { Component } from "../types";
import { getComponent, getSceneId } from "./scene";
import { TypedEventTarget } from "typescript-event-target";

interface HistoryObject {
  sceneId: string;
  id: string;
  state: Component | null;
}

interface HistoryEventMap {
  update: HistoryEvent;
}

type HistoryOperation = "do" | "undo" | "redo";

class HistoryEvent extends Event {
  operation: HistoryOperation;
  record: HistoryObject;

  constructor(operation: HistoryOperation, record: HistoryObject) {
    super("update");
    this.operation = operation;
    this.record = record;
  }
}

const undoStack: HistoryObject[] = [];
let redoStack: HistoryObject[] = [];

export const historyEvents = new TypedEventTarget<HistoryEventMap>();

export function updateHistory(id: string, prevState: Component | null) {
  const current = getComponent(id);
  if (fastIsEqual(prevState, current)) return;

  const sceneId = getSceneId();
  undoStack.push({ sceneId, id, state: prevState });
  if (undoStack.length > 100) undoStack.shift();
  redoStack = [];

  historyEvents.dispatchTypedEvent(
    "update",
    new HistoryEvent("do", { sceneId, id, state: structuredClone(current) })
  );
}

export function undo() {
  const record = undoStack.pop();
  if (!record) return;

  const { id, sceneId } = record;
  const current = structuredClone(getComponent(id));
  redoStack.push({ sceneId, id, state: current });

  historyEvents.dispatchTypedEvent(
    "update",
    new HistoryEvent("undo", { sceneId, id, state: record.state })
  );
}

export function redo() {
  const record = redoStack.pop();
  if (!record) return;

  const { id, sceneId } = record;
  const current = structuredClone(getComponent(id));
  undoStack.push({ sceneId, id, state: current });

  historyEvents.dispatchTypedEvent(
    "update",
    new HistoryEvent("redo", { sceneId, id, state: record.state })
  );
}
