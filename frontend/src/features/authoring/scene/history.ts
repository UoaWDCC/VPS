import { fastIsEqual } from "fast-is-equal";
import type { Component } from "../types";
import { getComponent, getSceneId } from "./scene";
import { TypedEventTarget } from "typescript-event-target";

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
    record: T extends "undo" | "redo" ? HistoryObject : HistoryObject | undefined
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

let undoStack: HistoryObject[] = [];
let redoStack: HistoryObject[] = [];

export const historyEvents = new TypedEventTarget<HistoryEventMap>();

export function clearHistory() {
  undoStack = [];
  redoStack = [];
}

// NOTE: this should only be used for scene modifications that don't support undo/redo
export function dispatchModification() {
  historyEvents.dispatchTypedEvent(
    "update",
    new HistoryEvent("do", undefined)
  );
}

export function updateHistory(id: string, prevState: Component | null) {
  const current = getComponent(id);
  if (fastIsEqual(prevState, current)) return;

  const sceneId = getSceneId();
  const record = {
    sceneId,
    id,
    before: structuredClone(prevState),
    after: structuredClone(current),
  };

  undoStack.push(record);
  if (undoStack.length > 100) undoStack.shift();
  redoStack = [];

  historyEvents.dispatchTypedEvent(
    "update",
    new HistoryEvent("do", cloneHistoryRecord(record))
  );
}

export function undo() {
  const record = undoStack.pop();
  if (!record) return;

  redoStack.push(record);

  historyEvents.dispatchTypedEvent(
    "update",
    new HistoryEvent("undo", cloneHistoryRecord(record))
  );
}

export function redo() {
  const record = redoStack.pop();
  if (!record) return;

  undoStack.push(record);

  historyEvents.dispatchTypedEvent(
    "update",
    new HistoryEvent("redo", cloneHistoryRecord(record))
  );
}
