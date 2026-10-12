import { toolDefinitions } from "../commands/registry";
import type { CommandKind } from "../commands/types";
import type { Mode, PanelMode } from "./types";

// What each mode is allowed to do. The server enforces the same list
// (backend/src/util/ai/modes.js), and a test keeps the two the same.

export type ToolKind = CommandKind | "playtest" | "review";

export const MODE_KINDS: Record<Mode, ToolKind[]> = {
  ask: ["read"],
  plan: ["read", "write", "destructive"],
  build: ["read", "write", "destructive"],
  test: ["read", "playtest"],
  review: ["read", "review"],
};

const COMMAND_KINDS: ToolKind[] = ["read", "write", "destructive"];

/** The tools a mode may use, as the model is shown them. */
export function toolsForMode(mode: Mode) {
  const kinds = MODE_KINDS[mode].filter((kind): kind is CommandKind =>
    COMMAND_KINDS.includes(kind)
  );
  return toolDefinitions(kinds);
}

export const PANEL_MODES: {
  id: PanelMode;
  label: string;
  hint: string;
}[] = [
  {
    id: "ask",
    label: "Ask",
    hint: "Ask about the scenario. Nothing is changed.",
  },
  {
    id: "plan",
    label: "Plan",
    hint: "Get a checklist of changes to review, then apply the ones you want.",
  },
  {
    id: "build",
    label: "Build",
    hint: "The assistant makes the changes straight away. One undo takes them all back.",
  },
];
