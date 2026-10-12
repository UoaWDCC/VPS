import Ajv, { type ValidateFunction } from "ajv";
import type { Command, CommandInput, CommandSpec, JsonSchema } from "./types";

// One Ajv for every command. The model is the other half of this: it sees the
// same schemas as tool definitions, so what it's told and what's enforced
// can't drift apart. Two settings forgive the small slips weaker models make:
// a lone value where a list was wanted (or "10" for 10) is coerced, and
// arguments the command doesn't have are dropped rather than rejected.
const ajv = new Ajv({
  allErrors: true,
  coerceTypes: "array",
  removeAdditional: true,
  useDefaults: true,
  strict: true,
  // lets a schema say "at least one of these" (anyOf: [{ required }, ...])
  // without repeating each property inside every branch
  strictRequired: false,
});

const SCENE_ID: JsonSchema = {
  type: "string",
  description:
    "The scene to act on, by id or exact name. Leave out to use the scene that's open in the editor.",
};

/**
 * Describes a command. `sceneId` is added to its arguments, so every command
 * can target any scene of the scenario, not just the open one.
 */
export function defineCommand<A>(spec: CommandSpec<A>): Command {
  const properties = (spec.schema.properties ?? {}) as Record<string, unknown>;

  return {
    name: spec.name,
    description: spec.description,
    kind: spec.kind,
    schema: {
      type: "object",
      additionalProperties: false,
      ...spec.schema,
      properties: { sceneId: SCENE_ID, ...properties },
    },
    run: (input) => spec.run(input as CommandInput<A>),
  };
}

const validators = new WeakMap<Command, ValidateFunction>();

function validatorFor(command: Command) {
  let validate = validators.get(command);
  if (!validate) {
    validate = ajv.compile(command.schema);
    validators.set(command, validate);
  }
  return validate;
}

export type Validation =
  | { ok: true; args: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Checks arguments against a command's schema. Works on a copy, applying
 * defaults and the forgiving coercions described above.
 */
export function validateArgs(command: Command, raw: unknown): Validation {
  const args = structuredClone(raw ?? {});
  if (typeof args !== "object" || Array.isArray(args))
    return {
      ok: false,
      error: `Arguments for ${command.name} must be an object.`,
    };

  const validate = validatorFor(command);
  if (validate(args))
    return { ok: true, args: args as Record<string, unknown> };

  const problems = (validate.errors ?? []).map((e) => {
    const where = e.instancePath ? `"${e.instancePath.slice(1)}" ` : "";
    return `${where}${e.message ?? "is invalid"}`;
  });
  return {
    ok: false,
    error: `Invalid arguments for ${command.name}: ${problems.join("; ")}.`,
  };
}
