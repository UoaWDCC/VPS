import { useEffect, useState, type ChangeEvent } from "react";
import { fastIsEqual } from "fast-is-equal";
import useVisualScene, { type VisualSceneState } from "../stores/visual";
import { getObject } from "../scene/util";
import { getScene } from "../scene/scene";
import type { Scene } from "../types";
import { dispatchModification } from "../scene/history";
import { INVALID, type Coerced, type Raw } from "./coerce";

function getField(path: string, store: VisualSceneState) {
  const [object, key] = getObject(path, store as Record<keyof VisualSceneState, unknown>);
  return object[key];
}

// NOTE: this is temp because the zustand store is immutable, but an immer change may require a restructure
function setIn(obj: unknown, keys: string[], value: unknown): unknown {
  if (keys.length === 0) return value;
  const [key, ...rest] = keys;
  const source = (obj ?? {}) as Record<string, unknown>;
  const copy = (Array.isArray(obj) ? [...(obj as unknown[])] : { ...source }) as Record<string, unknown>;
  copy[key] = setIn(source[key], rest, value);
  return copy;
}

function setField<T>(path: string, value: T) {
  const [object, key] = getObject(path, getScene() as Record<keyof Scene, unknown>);
  object[key] = value;

  const [root, ...rest] = path.split(".");
  const state = useVisualScene.getState() as Record<keyof VisualSceneState, unknown>;
  useVisualScene.setState({
    [root]: setIn(state[root as keyof VisualSceneState], rest, value),
  } as Pick<VisualSceneState, keyof VisualSceneState>);

  dispatchModification();
}

function isChangeEvent(v: unknown) {
  return typeof v === "object" && v !== null && "nativeEvent" in v;
}

interface UseFieldOptions<T> {
  commit?: "onBlur" | "onChange";
  coerce?: (raw: Raw<T>) => Coerced<T>;
  empty?: Raw<T> | null;
}

function useField<T>(path: string, { commit = "onBlur", coerce, empty = "" }: UseFieldOptions<T> = {}) {
  const committed = useVisualScene(s => getField(path, s)) as T;
  const [draft, setDraft] = useState<Raw<T>>(committed);

  useEffect(() => setDraft(committed), [committed])

  function onChange(e: ChangeEvent<HTMLInputElement> | Raw<T>) {
    const raw = isChangeEvent(e) ? e.target.value : e;
    setDraft(raw);
    if (commit === "onChange") write(raw);
  }

  function onBlur() {
    if (commit === "onBlur") write(draft);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") write(draft);
  }

  function write(raw: Raw<T>) {
    const coerced = coerce ? coerce(raw) : raw;
    if (coerced === INVALID || fastIsEqual(coerced, committed)) setDraft(committed);
    else setField(path, coerced);
  }

  return { value: draft ?? empty, onChange, onBlur, onKeyDown }
}

export default useField;
