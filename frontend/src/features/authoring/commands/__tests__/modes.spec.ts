import { describe, expect, it } from "vitest";
import {
  MODE_KINDS,
  TOOL_KINDS,
  toolsFor,
} from "../../../../../../backend/src/util/ai/modes.js";
import { commands, toolDefinitions } from "../registry";
import type { CommandKind } from "../types";

// The server enforces which tools each AI mode may use, from its own list of
// tool names (the two packages share no code). This keeps that list and the
// editor's commands the same: when a command is added, renamed or changes
// kind, the backend's `util/ai/modes.js` has to change too.

const kinds: Record<string, string> = TOOL_KINDS;
const modeKinds: Record<string, CommandKind[]> = MODE_KINDS;

describe("the backend's list of tools per mode", () => {
  it("knows every command, with the same kind", () => {
    const wrong = commands
      .filter((command) => kinds[command.name] !== command.kind)
      .map((command) => `${command.name} (${command.kind})`);
    expect(wrong, "add these to backend/src/util/ai/modes.js").toEqual([]);
  });

  it("lists no tool the editor doesn't have", () => {
    const known = new Set(commands.map((command) => command.name));
    const extra = Object.keys(kinds).filter((name) => !known.has(name));
    expect(extra).toEqual([]);
  });

  it.each(Object.keys(modeKinds))(
    "offers the same tools in %s mode as the editor will",
    (mode) => {
      // how the assistant picks a mode's tools: by kind
      const offered = toolDefinitions(modeKinds[mode]).map(
        (tool) => tool.function.name
      );
      expect(offered.sort()).toEqual(toolsFor(mode).sort());
    }
  );

  it("keeps ask to tools that only look", () => {
    const writes = toolsFor("ask").filter((name) => kinds[name] !== "read");
    expect(writes).toEqual([]);
  });
});
