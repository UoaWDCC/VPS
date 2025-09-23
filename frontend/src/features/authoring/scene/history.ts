import { fastIsEqual } from "fast-is-equal";
import type { Component } from "../types";
import { getComponent, getScene } from "./scene";
import { merge } from "./util";
import useVisualScene from "../stores/visual";
import { buildVisualComponent } from "../pipeline";
import { add, remove } from "./operations/modifiers";

interface HistoryObject {
  id: string;
  state: Component | null;
}

const undoStack: HistoryObject[] = [];
const redoStack: HistoryObject[] = [];

export function updateHistory(id: string, prevState: Component | null) {
  if (fastIsEqual(prevState, getComponent(id))) return;
  undoStack.push({ id, state: prevState });
  redoStack.length = 0;
}

export function undo() {
  const prev = undoStack.pop();
  if (!prev) return;
  const current = structuredClone(getComponent(prev.id));
  if (current == null) add(prev.state!, false);
  else if (prev.state == null) remove(prev.id, false);
  else modifyComponent(prev.id, prev.state);
  redoStack.push({ id: prev.id, state: current });
}

export function redo() {
  const subs = redoStack.pop();
  if (!subs) return;
  const current = structuredClone(getComponent(subs.id));
  if (current == null) add(subs.state!, false);
  else if (subs.state == null) remove(subs.id, false);
  else modifyComponent(subs.id, subs.state);
  undoStack.push({ id: subs.id, state: current });
}

function modifyComponent(id: string, props: Record<string, any>) {
  const component = getScene().components[id];
  if (!component) return;
  const newComponent = merge(component, props) as Component;
  getScene().components[id] = newComponent;
  useVisualScene.getState().updateComponent(buildVisualComponent(newComponent));
}