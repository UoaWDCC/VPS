import type { Scene } from "../types";
import type { ScenarioProperty, SceneAdapter, Session } from "./types";

// A session over scenes held in memory, with nothing behind it. It's how the
// commands are tested, and how they'll run headless (evals, playtests).

export const CANVAS = { width: 1920, height: 1080 };

export function blankScene(overrides: Partial<Scene> = {}): Scene {
  return {
    _id: "scene-1",
    name: "Scene 1",
    components: {},
    roles: [],
    time: null,
    directLink: null,
    timerStateOperations: null,
    background: null,
    ...overrides,
  };
}

export interface MemorySession extends Session {
  scene: (id?: string) => Scene;
  selection: () => string[];
  /** Which writes happened, newest last. */
  writes: { sceneId: string }[];
  /** How many times a batch was opened. */
  batches: () => number;
}

export function createMemorySession(options: {
  scenes: Scene[];
  openSceneId?: string;
  properties?: ScenarioProperty[];
  selection?: string[];
  canvas?: { width: number; height: number };
}): MemorySession {
  const scenes = new Map(options.scenes.map((s) => [s._id, s]));
  const openSceneId = options.openSceneId ?? options.scenes[0]._id;
  let selection = options.selection ?? [];
  let batches = 0;
  const writes: { sceneId: string }[] = [];

  const adapter = (id: string): SceneAdapter | undefined => {
    if (!scenes.has(id)) return undefined;
    return {
      read: () => scenes.get(id) as Scene,
      write: (next) => {
        scenes.set(id, structuredClone(next));
        writes.push({ sceneId: id });
      },
      select: (ids) => {
        selection = ids;
      },
    };
  };

  return {
    world: () => ({
      canvas: options.canvas ?? CANVAS,
      openSceneId,
      scenes: [...scenes.values()],
      properties: options.properties ?? [],
      selection,
    }),
    adapter,
    batch: async (fn) => {
      batches++;
      return fn();
    },
    scene: (id = openSceneId) => scenes.get(id) as Scene,
    selection: () => selection,
    writes,
    batches: () => batches,
  };
}
