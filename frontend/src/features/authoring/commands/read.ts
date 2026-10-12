import { getComponentBindingTargets } from "../../../components/Properties/componentBindings";
import { checkScene } from "../../playScenario/debug/checks.js";
import { filterItems } from "../library/items.js";
import { KINDS, PRESET_ITEMS } from "../library/presets.js";
import { defineCommand } from "./define";
import { snapshotScenario, snapshotScene } from "./snapshot";
import { spatialIssues } from "./warnings";
import { componentText } from "./text";
import type { Command } from "./types";

// Commands that only look. They never change anything, so they're always
// safe to offer, in every mode.

const COMPONENT_TYPES = [
  "box",
  "ellipse",
  "speech",
  "textbox",
  "line",
  "image",
];

const getScene = defineCommand<Record<string, never>>({
  name: "get_scene",
  description:
    "Look at a scene: every component with its position and size on the 1920 x 1080 canvas (x and y are the top left), what it says, its colours, what pressing it does, and its place in the stack (z, 0 is the back). Also lists layout problems. Use this before editing so you know what's there.",
  kind: "read",
  schema: { properties: {} },
  run: ({ scene, world }) => {
    const snapshot = snapshotScene(scene, world);
    return {
      output: snapshot,
      summary: `"${scene.name}" has ${snapshot.components.length} components and ${snapshot.issues.length} layout problems.`,
    };
  },
});

const getScenario = defineCommand<Record<string, never>>({
  name: "get_scenario",
  description:
    "Look at the whole scenario in brief: every scene with how many components it has and where its buttons lead, plus all the properties. Use this to understand how scenes connect before building or changing them.",
  kind: "read",
  schema: { properties: {} },
  run: ({ world }) => ({
    output: snapshotScenario(world),
    summary: `${world.scenes.length} scenes and ${world.properties.length} properties.`,
  }),
});

const getSelection = defineCommand<Record<string, never>>({
  name: "get_selection",
  description:
    "What the author has selected in the editor right now. Commands accept 'selected' as a target, so use this when they say 'this' or 'it'.",
  kind: "read",
  schema: { properties: {} },
  run: ({ scene, world }) => {
    const selected = snapshotScene(scene, world).components.filter(
      (c) => c.selected
    );
    return {
      output: selected,
      summary: selected.length
        ? `${selected.length} selected.`
        : "Nothing is selected.",
    };
  },
});

interface FindArgs {
  text?: string;
  type?: string;
  clickable?: boolean;
}

const findComponents = defineCommand<FindArgs>({
  name: "find_components",
  description:
    "Find components in a scene by the text they show, their type, or whether pressing them does anything. Returns the same details as get_scene for just the matches.",
  kind: "read",
  schema: {
    properties: {
      text: {
        type: "string",
        description: "Part of the text to look for, ignoring case.",
      },
      type: { type: "string", enum: COMPONENT_TYPES },
      clickable: {
        type: "boolean",
        description:
          "True for components that do something when pressed (lead to a scene or change properties).",
      },
    },
  },
  run: ({ scene, args, world }) => {
    const words = args.text?.toLowerCase();
    const idsByText = new Set(
      Object.values(scene.components)
        .filter((c) => !words || componentText(c).toLowerCase().includes(words))
        .map((c) => c.id.slice(0, 8))
    );

    const found = snapshotScene(scene, world).components.filter(
      (c) =>
        idsByText.has(c.id) &&
        (!args.type || c.type === args.type) &&
        (args.clickable === undefined ||
          Boolean(c.clickable) === args.clickable)
    );
    return {
      output: found,
      summary: `Found ${found.length} matching component${found.length === 1 ? "" : "s"}.`,
    };
  },
});

interface LibraryArgs {
  query?: string;
  kind?: string;
}

const listLibrary = defineCommand<LibraryArgs>({
  name: "list_library",
  description:
    "Search the built-in asset library of ready-made buttons, icons and sounds. Matches names and tags (try 'heart', 'emergency', 'beep'). Use the ids it returns with add_library_item.",
  kind: "read",
  schema: {
    properties: {
      query: {
        type: "string",
        description: "Words to look for in names and tags.",
      },
      kind: { type: "string", enum: KINDS.filter((k) => k !== "document") },
    },
  },
  run: ({ args }) => {
    const items = filterItems(PRESET_ITEMS, {
      query: args.query,
      kind: (args.kind ?? "all") as "all" | (typeof KINDS)[number],
    }).map((item) => ({
      id: "id" in item ? item.id : item.key,
      kind: item.kind,
      name: item.name,
      tags: item.tags,
    }));
    return {
      output: items,
      summary: `${items.length} library item${items.length === 1 ? "" : "s"}.`,
    };
  },
});

const runChecks = defineCommand<Record<string, never>>({
  name: "run_checks",
  description:
    "Check a scene for mistakes that would otherwise fail silently when played: text that refers to a property that doesn't exist, buttons that change deleted properties or lead to missing scenes, and so on. Also reports layout problems.",
  kind: "read",
  schema: { properties: {} },
  run: ({ scene, world }) => {
    const problems = checkScene({
      scene,
      properties: world.properties,
      hasScene: (id: string) => world.scenes.some((s) => s._id === id),
      neighborsLoaded: true,
      getBindingTargets: getComponentBindingTargets,
    });
    const layout = spatialIssues(scene, world.canvas);
    return {
      output: { problems, layout },
      summary:
        problems.length + layout.length === 0
          ? "No problems found."
          : `${problems.length} logic problem${problems.length === 1 ? "" : "s"} and ${layout.length} layout problem${layout.length === 1 ? "" : "s"}.`,
    };
  },
});

export const readCommands: Command[] = [
  getScene,
  getScenario,
  getSelection,
  findComponents,
  listLibrary,
  runChecks,
];
