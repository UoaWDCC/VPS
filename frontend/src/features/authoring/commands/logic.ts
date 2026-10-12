import { COMPARATORS } from "../../../components/Properties/destination.js";
import { validComparators } from "../../../components/Properties/propertyTypes.js";
import { describeCondition } from "../../playScenario/debug/describe.js";
import type { Component } from "../types";
import { defineCommand } from "./define";
import { hasFrame } from "./geometry";
import {
  describeComponent,
  resolveComponent,
  resolveScene,
  shortId,
} from "./resolve";
import * as s from "./schemas";
import { CommandError, type Command, type World } from "./types";

// Commands that change what happens in the scenario rather than how it looks:
// where buttons lead and when.

type Loose = Record<string, unknown>;

interface RuleArgs {
  property: string;
  comparator: string;
  value: string;
  scene: string;
}

interface DestinationArgs {
  target: string;
  rules: RuleArgs[];
  otherwise?: string | null;
}

/** A property by exact name (any case) or id. */
function resolveProperty(world: World, ref: string) {
  const wanted = ref.trim();
  const byId = world.properties.find((p) => p.id === wanted);
  if (byId) return byId;

  const byName = world.properties.filter(
    (p) => p.name.trim().toLowerCase() === wanted.toLowerCase()
  );
  if (byName.length === 1) return byName[0];
  if (byName.length > 1)
    throw new CommandError(
      `More than one property is called "${ref}". Use its id.`
    );

  const known = world.properties.map((p) => `${p.name} (${p.type})`);
  throw new CommandError(
    `No property matches "${ref}". ${
      known.length
        ? `Properties: ${known.join(", ")}.`
        : "This scenario has no properties yet."
    }`
  );
}

/** The value as the property's own type, which is what the rule compares. */
function parseValue(type: string, name: string, raw: string) {
  const text = raw.trim();
  if (type === "number") {
    const number = Number(text);
    if (text === "" || !Number.isFinite(number))
      throw new CommandError(
        `${name} is a number, so the value has to be a number, not "${raw}".`
      );
    return number;
  }
  if (type === "boolean") {
    const lower = text.toLowerCase();
    if (lower !== "true" && lower !== "false")
      throw new CommandError(
        `${name} is true/false, so the value has to be true or false, not "${raw}".`
      );
    return lower === "true";
  }
  return raw;
}

const setConditionalDestination = defineCommand<DestinationArgs>({
  name: "set_conditional_destination",
  description:
    "Choose where a button leads. It can lead to different scenes depending on properties: 'rules' are checked in order, after the button's own property changes, and the first one that matches decides. 'otherwise' is the scene for when none match. This replaces the button's existing rules (an empty list removes them), so give every rule you want it to have. For a plain link to one scene, use no rules and only 'otherwise'. Example: Next goes to Deteriorates if heartRate > 120, otherwise to Stable.",
  kind: "write",
  schema: {
    required: ["target", "rules"],
    properties: {
      target: s.target,
      rules: {
        type: "array",
        maxItems: 20,
        description:
          "The rules, in the order they're checked. Put the most specific first. Use [] for none.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["property", "comparator", "value", "scene"],
          properties: {
            property: {
              type: "string",
              minLength: 1,
              description: "A property's name, from get_scenario.",
            },
            comparator: {
              type: "string",
              enum: COMPARATORS,
              description:
                "= and != work on every kind of property. > and < only on numbers.",
            },
            value: {
              type: "string",
              description:
                "What to compare with, written out: 120, true or Sam. It's read as the property's own type.",
            },
            scene: {
              type: "string",
              minLength: 1,
              description: "The scene to go to, by name or id.",
            },
          },
        },
      },
      otherwise: {
        type: ["string", "null"],
        description:
          "The scene for when no rule matches, by name or id. null means none: the player stays on this scene. Leave out to keep what the button has now.",
      },
    },
  },
  run: ({ scene, args, world }) => {
    const next = structuredClone(scene);
    const found = resolveComponent(next, args.target, world);
    if (!hasFrame(found))
      throw new CommandError(
        `${describeComponent(found)} isn't on the canvas, so it can't be pressed.`
      );
    const button = next.components[found.id] as Component & Loose;
    const warnings: string[] = [];

    const rules = args.rules.map((rule, index) => {
      const property = resolveProperty(world, rule.property);
      if (!validComparators[property.type]?.includes(rule.comparator))
        throw new CommandError(
          `Rule ${index + 1}: "${rule.comparator}" can't be used on the ${property.type} property ${property.name}. Use ${validComparators[property.type].join(" or ")}.`
        );
      return {
        stateVariableId: property.id,
        comparator: rule.comparator,
        value: parseValue(property.type, property.name, rule.value),
        sceneId: resolveScene(world, rule.scene)._id,
      };
    });

    rules.forEach((rule, index) => {
      const same = rules.findIndex(
        (earlier) =>
          earlier.stateVariableId === rule.stateVariableId &&
          earlier.comparator === rule.comparator &&
          earlier.value === rule.value
      );
      if (same !== -1 && same < index)
        warnings.push(
          `Rule ${index + 1} has the same condition as rule ${same + 1}, so it will never be reached.`
        );
    });

    if (rules.length) button.nextSceneRules = rules;
    else delete button.nextSceneRules;

    if (args.otherwise !== undefined)
      button.nextScene =
        args.otherwise === null
          ? null
          : resolveScene(world, args.otherwise)._id;

    if (rules.length && !button.nextScene)
      warnings.push(
        "No scene is set for when no rule matches, so the player will stay on this scene in that case. Set 'otherwise' if that isn't what you want."
      );

    let pressable = "";
    if (!button.clickable) {
      button.clickable = true;
      pressable = " It wasn't pressable, so it is now.";
    }

    const sceneName = (id: unknown) =>
      world.scenes.find((candidate) => candidate._id === id)?.name ??
      "an unknown scene";
    const described = rules.map(
      (rule) =>
        `${describeCondition(rule, world.properties)} → ${sceneName(rule.sceneId)}`
    );
    const otherwise = button.nextScene ? sceneName(button.nextScene) : null;

    return {
      scene: next,
      summary: `${describeComponent(found)} now ${
        rules.length
          ? `goes to ${described.join("; ")}; otherwise ${otherwise ? `to ${otherwise}` : "stays here"}`
          : otherwise
            ? `goes to ${otherwise}`
            : "leads nowhere"
      }.${pressable}`,
      output: {
        target: shortId(found.id),
        rules: described,
        otherwise,
      },
      warnings,
    };
  },
});

export const logicCommands: Command[] = [setConditionalDestination];
