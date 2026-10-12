import type { Scene } from "../types";

// The editor command API: every action an author can take, as a named command
// with a JSON schema. The core of each command is pure (it takes a scene and
// returns a new one), so the same commands run in the editor, in tests, and
// later in headless playtests and evals.

export type CommandKind = "read" | "write" | "destructive";

export type JsonSchema = Record<string, unknown>;

/** A scenario property, as the editor and the play page know it. */
export interface ScenarioProperty {
  id: string;
  name: string;
  type: string;
  value?: unknown;
}

/** Everything a command may look at besides the scene it's acting on. */
export interface World {
  canvas: { width: number; height: number };
  /** The scene open in the editor. Commands act on it unless told otherwise. */
  openSceneId: string;
  /** Every scene of the scenario, components keyed by id. */
  scenes: Scene[];
  properties: ScenarioProperty[];
  /** Selected component ids in the open scene. */
  selection: string[];
}

export interface CommandInput<A> {
  /** A copy of the scene being acted on: free to change. */
  scene: Scene;
  args: A;
  world: World;
}

export interface CommandOutcome {
  /** The scene afterwards. Leave out for commands that only read. */
  scene?: Scene;
  /** Components to select afterwards (open scene only). */
  select?: string[];
  /** What the model gets back besides the summary: ids created, a snapshot. */
  output?: unknown;
  summary: string;
  warnings?: string[];
}

export interface CommandSpec<A> {
  name: string;
  /** Written for the model: what it does, and when to use it. */
  description: string;
  kind: CommandKind;
  /** JSON schema of the arguments (an object). `sceneId` is added for you. */
  schema: JsonSchema;
  run: (input: CommandInput<A>) => CommandOutcome;
}

export interface Command {
  name: string;
  description: string;
  kind: CommandKind;
  schema: JsonSchema;
  run: (input: CommandInput<unknown>) => CommandOutcome;
}

/** A failure the model can act on: bad reference, nothing to do, and so on. */
export class CommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommandError";
  }
}

/** How a scene is read and written. The editor and tests each have one. */
export interface SceneAdapter {
  read: () => Scene;
  write: (next: Scene, previous: Scene) => void | Promise<void>;
  select?: (ids: string[]) => void;
}

export interface Session {
  world: () => World;
  adapter: (sceneId: string) => SceneAdapter | undefined;
  /** Groups the writes inside into one undo step. */
  batch?: <T>(fn: () => Promise<T>) => Promise<T>;
}

export interface Changes {
  added: string[];
  modified: string[];
  removed: string[];
  /** Scene-level fields that changed (name, time, background...). */
  fields: string[];
}

export interface RunResult {
  ok: boolean;
  command: string;
  summary?: string;
  error?: string;
  output?: unknown;
  changed?: Changes;
  warnings?: string[];
}
