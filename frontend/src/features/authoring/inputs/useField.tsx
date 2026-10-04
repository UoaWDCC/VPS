import {
  useEffect,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { fastIsEqual } from "fast-is-equal";
import useVisualScene, { type VisualSceneState } from "../stores/visual";
import { getObject } from "../scene/util";
import { getScene } from "../scene/scene";
import type { Component, Scene } from "../types";
import { dispatchModification } from "../scene/history";
import { INVALID, type Coercer } from "./coerce";
import { modifyComponentProp } from "../scene/operations/component";

function getField(
  path: string,
  store: VisualSceneState,
  component?: string | null
) {
  if (component === null) return;
  const [object, key] = getObject(
    path,
    component
      ? (store["components"][component] as Record<keyof Component, unknown>)
      : (store as Record<keyof VisualSceneState, unknown>)
  );
  return object[key];
}

// NOTE: this is temp because the zustand store is immutable, but an immer change may require a restructure
function setIn(obj: unknown, keys: string[], value: unknown): unknown {
  if (keys.length === 0) return value;
  const [key, ...rest] = keys;
  const source = (obj ?? {}) as Record<string, unknown>;
  const copy = (
    Array.isArray(obj) ? [...(obj as unknown[])] : { ...source }
  ) as Record<string, unknown>;
  copy[key] = setIn(source[key], rest, value);
  return copy;
}

function setField<T>(path: string, value: T) {
  const [object, key] = getObject(
    path,
    getScene() as Record<keyof Scene, unknown>
  );
  object[key] = value;

  const [root, ...rest] = path.split(".");
  const state = useVisualScene.getState() as Record<
    keyof VisualSceneState,
    unknown
  >;
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

function isChangeEvent(v: unknown): v is ChangeEvent<HTMLInputElement> {
  return typeof v === "object" && v !== null && "nativeEvent" in v;
}

interface BaseOptions {
  commit?: "onBlur" | "onChange";
  component?: string | null;
}

type EmptyOption<D> = "" extends D ? { empty?: D } : { empty: D };

type IdentityOptions<T> = BaseOptions & {
  coerce?: Coercer<T, T>;
} & EmptyOption<T>;

type DerivedOptions<T, D> = BaseOptions & {
  derive: (committed: T) => D;
  coerce: Coercer<D, T>;
} & EmptyOption<D>;

interface Field<D> {
  props: {
    value: D;
    onChange: (
      v: D | (string extends D ? ChangeEvent<HTMLInputElement> : never)
    ) => void;
    onBlur: () => void;
    onKeyDown: (e: KeyboardEvent) => void;
  };
  error: boolean;
}

function useField<T>(path: string, options?: IdentityOptions<T>): Field<T>;
function useField<T, D>(path: string, options: DerivedOptions<T, D>): Field<D>;
function useField(
  path: string,
  options: {
    commit?: "onBlur" | "onChange";
    component?: string | null;
    derive?: (committed: unknown) => unknown;
    coerce?: Coercer<unknown, unknown>;
    empty?: unknown;
  } = {}
): Field<unknown> {
  const { commit = "onBlur", coerce, derive, empty = "", component } = options;

  const committed = useVisualScene((s) => getField(path, s, component));

  function toDraft(value: unknown) {
    if (value === undefined) return empty;
    return derive ? derive(value) : value;
  }

  const [draft, setDraft] = useState(() => toDraft(committed));
  const [error, setError] = useState(false);

  useEffect(() => setDraft(toDraft(committed)), [committed]);

  function onChange(e: unknown) {
    const value = isChangeEvent(e) ? e.target.value : e;
    setDraft(value);
    if (commit === "onChange") write(value);
  }

  function onBlur() {
    if (commit === "onBlur") write(draft);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") write(draft);
  }

  function write(value: unknown) {
    const coerced = coerce ? coerce(value, committed) : value;
    if (coerced === INVALID) {
      setError(true);
      return;
    }
    setError(false);
    if (fastIsEqual(coerced, committed)) return;
    else if (component !== undefined)
      setComponentField(path, component, coerced);
    else setField(path, coerced);
  }

  return {
    props: { value: draft, onChange, onBlur, onKeyDown },
    error,
  };
}

export default useField;
