import { fastIsEqual } from "fast-is-equal";
import type { Component } from "../types";
import { getComponent, getSceneId } from "./scene";
import { TypedEventTarget } from "typescript-event-target";

interface HistoryRecord {
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
  record: T extends "undo" | "redo"
    ? HistoryRecord[]
    : HistoryRecord[] | undefined;

  constructor(
    operation: T,
    record: T extends "undo" | "redo"
      ? HistoryRecord[]
      : HistoryRecord[] | undefined
  ) {
    super("update");
    this.operation = operation;
    this.record = record;
  }
}

function cloneHistoryBatch(batch: HistoryRecord[]): HistoryRecord[] {
  return batch.map((record) => ({
    sceneId: record.sceneId,
    id: record.id,
    before: structuredClone(record.before),
    after: structuredClone(record.after),
  }));
}

export interface ChangeRecord {
  id: string;
  prevState: Component | null;
}

type ActionHistory = "redo" | "undo";

let undoStack: HistoryRecord[][] = [];
let redoStack: HistoryRecord[][] = [];

export const historyEvents = new TypedEventTarget<HistoryEventMap>();

export function clearHistory() {
  undoStack = [];
  redoStack = [];
}

// NOTE: this should only be used for scene modifications that don't support undo/redo
export function dispatchModification() {
  historyEvents.dispatchTypedEvent("update", new HistoryEvent("do", undefined));
}

export function updateHistory(incomingChanges: ChangeRecord[]) {
  const sceneId = getSceneId();
  const batch: HistoryRecord[] = [];

  incomingChanges.forEach(({ id, prevState }) => {
    const current = getComponent(id);
    if (fastIsEqual(prevState, current)) return;

    batch.push({
      sceneId,
      id,
      before: structuredClone(prevState),
      after: structuredClone(current),
    });
  });

  if (batch.length === 0) return;

  undoStack.push(batch);
  if (undoStack.length > 100) undoStack.shift();
  redoStack = [];

  historyEvents.dispatchTypedEvent(
    "update",
    new HistoryEvent("do", cloneHistoryBatch(batch))
  );
}

export function handleHistoryChange(action: ActionHistory) {
  const isUndo = action === "undo";
  const sourceStack = isUndo ? undoStack : redoStack;
  const targetStack = isUndo ? redoStack : undoStack;

  const batch = sourceStack.pop();
  if (!batch || batch.length === 0) return;

  targetStack.push(batch);

  historyEvents.dispatchTypedEvent(
    "update",
    new HistoryEvent(action, cloneHistoryBatch(batch))
  );
}
