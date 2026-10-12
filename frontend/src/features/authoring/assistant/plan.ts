import { getCommand } from "../commands/registry";
import { recordIds, replayIds, withIds } from "../commands/ids";
import { createMemorySession, type MemorySession } from "../commands/memory";
import { shortId } from "../commands/resolve";
import { runCommand } from "../commands/run";
import type { CommandKind, RunResult, Session } from "../commands/types";

// Plan mode. The assistant's tools run on a private copy of the scenario, so
// nothing real changes, and each change it makes is written down as a step.
// The author then picks which steps to apply, and they're run again on the
// real scenario, in order, as a single undo step.
//
// Running a step a second time has to give the same result, so a step that
// creates something keeps the ids it was given and the second run uses the
// same ones. That's what lets a later step say "move that new button" and
// still find it, whichever steps were picked.

export interface PlanStep {
  id: string;
  name: string;
  args: Record<string, unknown>;
  kind: CommandKind;
  /** What it does, in words. */
  summary: string;
  warnings?: string[];
  /** Ids of the components this step creates. */
  created: string[];
  /** Earlier steps this one uses the results of. */
  dependsOn: string[];
}

export interface PlanRecorder {
  /** A session over the private copy, for the assistant to work in. */
  session: MemorySession;
  /** How the assistant's tools are run in Plan mode. */
  execute: (name: string, args: unknown) => Promise<RunResult>;
  steps: () => PlanStep[];
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The earlier steps whose new components this step's arguments mention. */
function dependenciesOf(args: unknown, earlier: PlanStep[]) {
  const text = JSON.stringify(args);
  return earlier
    .filter((step) =>
      step.created.some((id) => text.includes(id) || text.includes(shortId(id)))
    )
    .map((step) => step.id);
}

/** Starts a plan from the scenario as it is now. */
export function createPlanRecorder(live: Session): PlanRecorder {
  const world = live.world();
  const session = createMemorySession({
    scenes: structuredClone(world.scenes),
    openSceneId: world.openSceneId,
    properties: structuredClone(world.properties),
    selection: [...world.selection],
    canvas: world.canvas,
  });
  const steps: PlanStep[] = [];

  return {
    session,
    steps: () => steps,
    execute: async (name, args) => {
      const ids = recordIds();
      const result = await withIds(ids.next, () =>
        runCommand(session, name, args)
      );

      const command = getCommand(name);
      const changedSomething =
        result.changed &&
        (result.changed.added.length ||
          result.changed.modified.length ||
          result.changed.removed.length ||
          result.changed.fields.length);

      // looking, failing and changing nothing aren't part of the plan
      if (result.ok && command && command.kind !== "read" && changedSomething) {
        const planned = isObject(args) ? args : {};
        steps.push({
          id: `step-${steps.length + 1}`,
          name,
          args: structuredClone(planned),
          kind: command.kind,
          summary: result.summary ?? name,
          warnings: result.warnings,
          // only ids that ended up in the scenario belong to this step
          created: ids.minted.filter((id) =>
            result.changed?.added.includes(shortId(id))
          ),
          dependsOn: dependenciesOf(planned, steps),
        });
      }
      return result;
    },
  };
}

/**
 * Ticks or unticks a step, with what goes with it: unticking a step unticks
 * the steps that use what it makes, and ticking one ticks the steps it needs.
 */
export function toggleStep(
  steps: PlanStep[],
  selected: ReadonlySet<string>,
  stepId: string,
  on: boolean
) {
  const next = new Set(selected);
  const byId = new Map(steps.map((step) => [step.id, step]));

  const tick = (id: string) => {
    if (next.has(id)) return;
    next.add(id);
    byId.get(id)?.dependsOn.forEach(tick);
  };
  const untick = (id: string) => {
    if (!next.delete(id)) return;
    steps
      .filter((step) => step.dependsOn.includes(id))
      .forEach((s) => untick(s.id));
  };

  if (on) tick(stepId);
  else untick(stepId);
  return next;
}

export interface ApplyResult {
  applied: PlanStep[];
  failed: { step: PlanStep; error: string }[];
}

/**
 * Makes the chosen steps real, in the order they were planned, as one undo
 * step. A step that can't be done any more (the author changed the scene since,
 * or a step it needed was left out) is reported and the rest carry on.
 */
export async function applyPlan(
  live: Session,
  steps: PlanStep[],
  selected: ReadonlySet<string>
): Promise<ApplyResult> {
  const result: ApplyResult = { applied: [], failed: [] };

  const run = async () => {
    for (const step of steps.filter((s) => selected.has(s.id))) {
      const outcome = await withIds(replayIds(step.created), () =>
        runCommand(live, step.name, step.args)
      );
      if (outcome.ok) result.applied.push(step);
      else
        result.failed.push({
          step,
          error: outcome.error ?? `${step.name} didn't work`,
        });
    }
  };

  if (live.batch) await live.batch(run);
  else await run();
  return result;
}

/** The words in a value, shortened. Anything that isn't words is nothing. */
const words = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";

const clip = (value: unknown, max = 40) => {
  const text = words(value).replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

/**
 * A step in words for the author. The commands' own summaries are written for
 * the model and have ids in them, which mean nothing to the author.
 */
export function describeStep(step: PlanStep) {
  const { args } = step;
  switch (step.name) {
    case "add_button":
      return `Add a button${args.label ? ` "${clip(args.label)}"` : ""}`;
    case "add_text":
      return `Add text "${clip(args.text)}"`;
    case "add_shape":
      return `Add ${/^[aeiou]/i.test(words(args.shape)) ? "an" : "a"} ${words(args.shape) || "shape"}`;
    case "add_library_item":
      return `Add "${clip(args.itemId)}" from the library`;
    default:
      return (
        step.summary
          // "aaaaaaaa (box "Continue")" -> `the box "Continue"`
          .replace(/(?<![\w-])[\w-]{8} \(([^)]*)\)/g, "the $1")
          .replace(/\s[0-9a-f]{8}\b/g, "")
      );
  }
}
