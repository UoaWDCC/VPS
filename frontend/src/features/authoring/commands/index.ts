// The editor command API: every action an author can take in the editor, as
// named, validated commands with JSON schemas.
//
//   registry   the commands, and their tool definitions for a model
//   run        runCommand / runBatch
//   live       a session over the real editor
//   memory     a session over scenes held in memory (tests, headless use)
//   snapshot   what the model sees of a scene and a scenario

export { commands, getCommand, toolDefinitions } from "./registry";
export { runBatch, runCommand, type BatchResult } from "./run";
export { createLiveSession, type LiveEnvironment } from "./live";
export { installDevConsole } from "./devConsole";
export { createMemorySession, blankScene } from "./memory";
export {
  snapshotScene,
  snapshotScenario,
  type SceneSnapshot,
  type ScenarioSnapshot,
} from "./snapshot";
export type { Command, RunResult, Session, World } from "./types";
