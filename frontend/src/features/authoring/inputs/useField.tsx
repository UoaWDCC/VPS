import { useEffect, useState, type ChangeEvent } from "react";
import { fastIsEqual } from "fast-is-equal";
import useVisualScene, { type VisualSceneState } from "../stores/visual";
import { getObject } from "../scene/util";
import { getScene } from "../scene/scene";
import type { Component, Scene } from "../types";
import { dispatchModification } from "../scene/history";
import { INVALID, type Coerced, type Raw } from "./coerce";
import { modifyComponentProp } from "../scene/operations/component";

function getField<T>(path: string, store: VisualSceneState, component?: string | null) {
  if (component === null) return;
  const [object, key] = getObject(path, component
    ? store["components"][component] as Record<keyof Component, unknown>
    : store as Record<keyof VisualSceneState, unknown>);
  return object[key] as T;
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

// NOTE: this needs to be distinct because of history handling
function setComponentField<T>(path: string, id: string | null, value: T) {
  if (id === null) return;
  modifyComponentProp([id], path, value);
}

function isChangeEvent(v: unknown) {
  return typeof v === "object" && v !== null && "nativeEvent" in v;
}

function handleDerivation<T>(value: T | undefined, derive: UseFieldOptions<T>["derive"]) {
  if (value === undefined) return null;
  else return derive ? derive(value) : value;
}

function handleCoercion<T>(value: Raw<T>, coerce: UseFieldOptions<T>["coerce"]): Coerced<Raw<T>> {
  if (!coerce) return value;
  if (!Array.isArray(coerce)) return coerce(value);

  const steps = coerce.slice(0, -1) as CoerceStep<T>[];
  const final = coerce[coerce.length - 1] as Coercer<T>;
  let current = value;
  for (const step of steps) {
    const next = step(current);
    if (next === INVALID) return INVALID;
    current = next;
  }
  return final(current);
}

// intermediate steps may return raw values; only the final coercer must produce a Coerced<T>
type CoerceStep<T> = (raw: Raw<T>) => Coerced<Raw<T>>;
type Coercer<T> = (raw: Raw<T>) => Coerced<T>;

interface UseFieldOptions<T> {
  commit?: "onBlur" | "onChange";
  component?: string | null;
  derive?: (base: T) => Raw<T>;
  coerce?: Coercer<T> | [...CoerceStep<T>[], Coercer<T>];
  empty?: Raw<T> | null;
}

function useField<T>(path: string, { commit = "onBlur", coerce, derive, empty = "", component }: UseFieldOptions<T> = {}) {
  const committed = useVisualScene(s => getField<T>(path, s, component));

  const [draft, setDraft] = useState<Raw<T>>(handleDerivation(committed, derive));
  const [error, setError] = useState(false);

  useEffect(() => setDraft(handleDerivation(committed, derive)), [committed])

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
    const coerced = handleCoercion(raw, coerce);
    if (coerced === INVALID) {
      setError(true);
      return;
    }
    setError(false);
    if (fastIsEqual(coerced, committed)) return;
    else if (component !== undefined) setComponentField(path, component, coerced)
    else setField(path, coerced);
  }

  return { props: { value: draft ?? empty, onChange, onBlur, onKeyDown }, error }
}

export default useField;
