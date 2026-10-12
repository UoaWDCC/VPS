import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../../../util/canvas";
import { beginHistoryBatch, endHistoryBatch } from "../scene/history";
import {
  add,
  modifySceneProp,
  overwrite,
  remove,
} from "../scene/operations/modifiers";
import { getScene, getSceneId } from "../scene/scene";
import { arrayToObject } from "../scene/util";
import useEditorStore from "../stores/editor";
import type { VisualSceneState } from "../stores/visual";
import type { Scene } from "../types";
import { diffScenes } from "./diff";
import type { ScenarioProperty, SceneAdapter, Session } from "./types";

// The commands, connected to the real editor. Everything the editor shows and
// does (the canvas, undo, autosave) is driven by its own operations, so a
// command's result is turned back into those rather than poking at state.

export interface LiveEnvironment {
  /** Every scene as the scene context holds them (components as a list). */
  getScenes: () => Scene[];
  getProperties: () => ScenarioProperty[];
  /** Saves a scene, the way the editor's autosave does. */
  modifyScene: (scene: Scene) => Promise<unknown> | undefined;
}

/** Scenes arrive with components as a list; commands want them keyed by id. */
function keyed(scene: Scene): Scene {
  const copy = structuredClone(scene);
  if (Array.isArray(copy.components))
    copy.components = arrayToObject(
      copy.components as unknown as { id: string }[]
    ) as Scene["components"];
  return copy;
}

/**
 * Applies a command's result to the scene open in the editor, through the
 * editor's own add, change and remove operations, so it draws, saves and
 * undoes like anything the author did by hand.
 */
function writeToOpenScene(next: Scene, previous: Scene) {
  const changes = diffScenes(previous, next);

  if (changes.removed.length) {
    // The overlay draws whatever is selected, so nothing about to be removed
    // may still be selected when it goes (the editor's own delete does this too)
    const { selected, setSelected } = useEditorStore.getState();
    if (selected.some((id) => changes.removed.includes(id)))
      setSelected(selected.filter((id) => !changes.removed.includes(id)));
    remove(changes.removed);
  }
  changes.modified.forEach((id) =>
    overwrite(id, structuredClone(next.components[id]))
  );
  changes.added.forEach((id) => add(structuredClone(next.components[id])));

  changes.fields.forEach((field) =>
    modifySceneProp(
      field as keyof VisualSceneState,
      structuredClone(
        (next as unknown as Record<string, unknown>)[field]
      ) as never
    )
  );
}

/**
 * A session over the editor as it is right now. Reads are always fresh, so a
 * command sees what the author has done since the last one.
 */
export function createLiveSession(env: LiveEnvironment): Session {
  const select = (ids: string[]) => useEditorStore.getState().setSelected(ids);

  const world = () => {
    const openSceneId = getSceneId();
    return {
      canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      openSceneId,
      // the open scene is the live one, not the last saved copy of it
      scenes: env
        .getScenes()
        .map((scene) =>
          scene._id === openSceneId ? getScene() : keyed(scene)
        ),
      properties: env.getProperties(),
      selection: useEditorStore.getState().selected,
    };
  };

  const adapter = (sceneId: string): SceneAdapter | undefined => {
    if (sceneId === getSceneId())
      return { read: getScene, write: writeToOpenScene, select };

    const saved = env.getScenes().find((scene) => scene._id === sceneId);
    if (!saved) return undefined;

    // Another scene isn't on screen: it's changed and saved directly.
    // (The editor's undo only knows the open scene, so this isn't undoable.)
    return {
      read: () =>
        keyed(env.getScenes().find((s) => s._id === sceneId) ?? saved),
      write: async (next) => {
        await env.modifyScene(structuredClone(next));
      },
    };
  };

  return {
    world,
    adapter,
    batch: async (fn) => {
      beginHistoryBatch();
      try {
        return await fn();
      } finally {
        endHistoryBatch();
      }
    },
  };
}
