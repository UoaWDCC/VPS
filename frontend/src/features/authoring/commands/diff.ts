import { fastIsEqual } from "fast-is-equal";
import type { Scene } from "../types";
import type { Changes } from "./types";

// Scene-level fields the editor keeps outside the component list.
export const SCENE_FIELDS = [
  "name",
  "roles",
  "time",
  "directLink",
  "timerStateOperations",
  "background",
] as const;

/**
 * What differs between two versions of a scene, by component id. Commands are
 * written as "scene in, scene out", so this is how a result is turned back
 * into the add, change and remove operations the editor understands.
 */
export function diffScenes(previous: Scene, next: Scene): Changes {
  const before = previous.components;
  const after = next.components;

  const record = (scene: Scene) => scene as unknown as Record<string, unknown>;

  return {
    added: Object.keys(after).filter((id) => !(id in before)),
    removed: Object.keys(before).filter((id) => !(id in after)),
    modified: Object.keys(after).filter(
      (id) => id in before && !fastIsEqual(before[id], after[id])
    ),
    fields: SCENE_FIELDS.filter(
      (key) => !fastIsEqual(record(previous)[key], record(next)[key])
    ),
  };
}

export function isEmpty(changes: Changes) {
  return (
    !changes.added.length &&
    !changes.removed.length &&
    !changes.modified.length &&
    !changes.fields.length
  );
}
