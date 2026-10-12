import { getCommand } from "../commands/registry";
import { resolveComponents, describeComponent } from "../commands/resolve";
import { runCommand } from "../commands/run";
import type { RunResult, Session } from "../commands/types";
import { toolsForMode } from "./modes";
import type { Mode } from "./types";

// Running one tool call from the model. Whatever it sends, nothing here
// throws: a call that can't be run comes back as a message the model can read
// and correct itself from.

export interface ToolDefinitionLike {
  type: "function";
  function: { name: string; description: string; parameters: unknown };
}

export interface ConfirmRequest {
  name: string;
  args: unknown;
  /** What is about to happen, in words. */
  description: string;
}

export interface ToolRunContext {
  mode: Mode;
  session: Session;
  /** Asked before anything destructive. Without it, destructive calls run. */
  confirm?: (request: ConfirmRequest) => Promise<boolean>;
  /** How a command is run. Plan mode swaps this to keep a record. */
  execute?: (name: string, args: unknown) => Promise<RunResult>;
}

export interface ToolOutcome {
  name: string;
  args: unknown;
  ok: boolean;
  /** The author said no to a deletion. */
  declined?: boolean;
  /** One line, for the activity log. */
  summary: string;
  warnings?: string[];
  /** What the model is told. */
  content: string;
  result?: RunResult;
}

/** About this much of a result goes back to the model; more is cut. */
const MAX_RESULT_CHARS = 14000;

function failure(
  name: string,
  args: unknown,
  error: string,
  extra: Partial<ToolOutcome> = {}
): ToolOutcome {
  return {
    name,
    args,
    ok: false,
    summary: error,
    content: JSON.stringify({ ok: false, error }),
    ...extra,
  };
}

/** The arguments as an object, or why they can't be. */
function parseArguments(
  name: string,
  raw: unknown
): { args: Record<string, unknown> } | { error: string } {
  let value = raw;

  // some models write the arguments as text inside text
  for (let i = 0; i < 2 && typeof value === "string"; i++) {
    const text = value.trim();
    if (!text) {
      value = {};
      break;
    }
    try {
      value = JSON.parse(text) as unknown;
    } catch (error) {
      return {
        error: `The arguments for ${name} aren't valid JSON (${
          error instanceof Error ? error.message : "can't be read"
        }). Call ${name} again with the arguments as one JSON object.`,
      };
    }
  }

  if (value === null || value === undefined) return { args: {} };
  if (typeof value !== "object" || Array.isArray(value))
    return {
      error: `The arguments for ${name} must be one JSON object, like {"targets": ["abc12345"]}.`,
    };
  return { args: value as Record<string, unknown> };
}

/** In words: what a destructive call is about to do. */
export function describeCall(
  session: Session,
  name: string,
  args: Record<string, unknown>
) {
  if (name === "delete_components") {
    try {
      const world = session.world();
      const sceneId =
        typeof args.sceneId === "string" ? args.sceneId : world.openSceneId;
      const scene = world.scenes.find(
        (s) => s._id === sceneId || s.name === sceneId
      );
      const targets = Array.isArray(args.targets) ? args.targets : [];
      if (scene && targets.length) {
        // `3f2a1b9c (box "Next")` becomes `box "Next"`: the id means nothing to the author
        const found = resolveComponents(scene, targets.map(String), world).map(
          (component) =>
            describeComponent(component).replace(/^\S+ \((.*)\)$/, "$1")
        );
        return `Delete ${found.length} ${
          found.length === 1 ? "component" : "components"
        } from "${scene.name}": ${found.join(", ")}`;
      }
    } catch {
      // the call itself will say what's wrong with it
    }
  }
  return `${name} ${JSON.stringify(args)}`;
}

function contentFor(result: RunResult) {
  const text = JSON.stringify(
    result.ok
      ? {
          ok: true,
          summary: result.summary,
          output: result.output,
          changed: result.changed,
          warnings: result.warnings,
        }
      : { ok: false, error: result.error }
  );
  if (text.length <= MAX_RESULT_CHARS) return text;
  return `${text.slice(0, MAX_RESULT_CHARS)}… (cut: ${
    text.length - MAX_RESULT_CHARS
  } more characters. Ask for less, for example with find_components.)`;
}

/** Runs one call to a tool by name, with its arguments as the model sent them. */
export async function runTool(
  context: ToolRunContext,
  name: string,
  rawArguments: unknown
): Promise<ToolOutcome> {
  const parsed = parseArguments(name, rawArguments);
  if ("error" in parsed) return failure(name, rawArguments, parsed.error);
  const { args } = parsed;

  const allowed = toolsForMode(context.mode).map((tool) => tool.function.name);
  const command = getCommand(name);
  if (!command)
    return failure(
      name,
      args,
      `There's no tool called "${name}". The tools you can use are: ${allowed.join(", ")}.`
    );
  if (!allowed.includes(name))
    return failure(
      name,
      args,
      `${name} isn't available in ${context.mode} mode. The tools you can use are: ${allowed.join(", ")}.`
    );

  if (command.kind === "destructive" && context.confirm) {
    const description = describeCall(context.session, name, args);
    const approved = await context.confirm({ name, args, description });
    if (!approved)
      return failure(
        name,
        args,
        "The author said no, so nothing was deleted. Don't try again unless they ask.",
        { declined: true, summary: `Skipped: ${description}` }
      );
  }

  const result = await (context.execute
    ? context.execute(name, args)
    : runCommand(context.session, name, args));

  return {
    name,
    args,
    ok: result.ok,
    summary: result.ok ? (result.summary ?? name) : (result.error ?? name),
    warnings: result.warnings,
    content: contentFor(result),
    result,
  };
}
