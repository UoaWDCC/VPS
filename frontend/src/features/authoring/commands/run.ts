import { validateArgs } from "./define";
import { diffScenes, isEmpty } from "./diff";
import { shortId, resolveScene } from "./resolve";
import { getCommand, commands } from "./registry";
import { spatialIssues } from "./warnings";
import {
  CommandError,
  type Changes,
  type RunResult,
  type Session,
} from "./types";

// Running a command: check the arguments, work out what to do, apply it, and
// say what happened in terms a model can act on. Failures never throw; they
// come back as { ok: false, error } so the model can read them and try again.

function fail(command: string, error: string): RunResult {
  return { ok: false, command, error };
}

function shorten(changes: Changes): Changes {
  return {
    added: changes.added.map(shortId),
    modified: changes.modified.map(shortId),
    removed: changes.removed.map(shortId),
    fields: changes.fields,
  };
}

export async function runCommand(
  session: Session,
  name: string,
  rawArgs: unknown
): Promise<RunResult> {
  const command = getCommand(name);
  if (!command)
    return fail(
      name,
      `There's no command called "${name}". The commands are: ${commands.map((c) => c.name).join(", ")}.`
    );

  const validation = validateArgs(command, rawArgs);
  if (!validation.ok) return fail(name, validation.error);
  const args = validation.args;

  try {
    const world = session.world();
    const target =
      typeof args.sceneId === "string"
        ? resolveScene(world, args.sceneId)
        : world.scenes.find((s) => s._id === world.openSceneId);
    if (!target) return fail(name, "No scene is open.");

    const adapter = session.adapter(target._id);
    if (!adapter)
      return fail(name, `The scene "${target.name}" can't be edited.`);

    const before = structuredClone(adapter.read());
    const outcome = command.run({
      scene: structuredClone(before),
      args,
      world,
    });

    if (command.kind === "read" && outcome.scene)
      throw new Error("a read command changed the scene");

    const warnings = [...(outcome.warnings ?? [])];
    let changes: Changes | undefined;

    if (outcome.scene) {
      changes = diffScenes(before, outcome.scene);

      if (!isEmpty(changes)) {
        warnings.push(
          ...spatialIssues(outcome.scene, world.canvas, [
            ...changes.added,
            ...changes.modified,
          ])
        );
        await adapter.write(outcome.scene, before);
      }
    }

    if (outcome.select && target._id === world.openSceneId)
      adapter.select?.(outcome.select);

    return {
      ok: true,
      command: name,
      summary:
        changes && isEmpty(changes)
          ? `${outcome.summary} (nothing needed to change)`
          : outcome.summary,
      output: outcome.output,
      changed: changes && shorten(changes),
      warnings: warnings.length ? warnings : undefined,
    };
  } catch (error) {
    if (error instanceof CommandError) return fail(name, error.message);
    console.error(error);
    return fail(
      name,
      `Something went wrong running ${name}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export interface BatchResult {
  results: RunResult[];
  /** False if a command failed and the rest were skipped. */
  completed: boolean;
}

/**
 * Runs commands one after another, each seeing what the last did, as a single
 * undo step. Stops at the first failure; what ran before it stays applied.
 */
export async function runBatch(
  session: Session,
  calls: { name: string; args?: unknown }[]
): Promise<BatchResult> {
  const results: RunResult[] = [];

  const runAll = async () => {
    for (const call of calls) {
      const result = await runCommand(session, call.name, call.args);
      results.push(result);
      if (!result.ok) return false;
    }
    return true;
  };

  const completed = session.batch
    ? await session.batch(runAll)
    : await runAll();
  return { results, completed };
}
