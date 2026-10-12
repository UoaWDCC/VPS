import { addCommands } from "./add";
import { arrangeCommands } from "./arrange";
import { readCommands } from "./read";
import { removeCommands } from "./remove";
import { styleCommands } from "./style";
import type { Command, CommandKind } from "./types";

/** Every command the editor offers, in the order they're shown to the model. */
export const commands: Command[] = [
  ...readCommands,
  ...addCommands,
  ...styleCommands,
  ...arrangeCommands,
  ...removeCommands,
];

const byName = new Map<string, Command>();
for (const command of commands) {
  if (byName.has(command.name))
    throw new Error(`Two commands are called "${command.name}"`);
  byName.set(command.name, command);
}

export function getCommand(name: string) {
  return byName.get(name);
}

export interface ToolDefinition {
  type: "function";
  function: { name: string; description: string; parameters: unknown };
}

/**
 * The commands as tool definitions in the OpenAI function-calling format,
 * which OpenRouter models understand. Optionally only some kinds, which is how
 * a mode will limit what the model is offered.
 */
export function toolDefinitions(kinds?: CommandKind[]): ToolDefinition[] {
  return commands
    .filter((command) => !kinds || kinds.includes(command.kind))
    .map((command) => ({
      type: "function",
      function: {
        name: command.name,
        description: command.description,
        parameters: command.schema,
      },
    }));
}
