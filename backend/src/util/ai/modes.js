// What the AI assistant may do in each mode, enforced here as well as in the
// editor so a client that ignores the rules still can't offer the model a tool
// the mode doesn't allow.
//
// Every tool has a kind, and a mode allows some kinds:
//
//   read         look at the scenario or the editor (never changes the scenario)
//   write        change the scenario
//   destructive  delete things (the editor asks first)
//   playtest     play the scenario in a sandbox
//   review       read anonymised dashboard data
//
// The tools are the editor's commands (frontend/src/features/authoring/commands),
// which have no code in common with the backend, so the list is repeated here.
// A frontend test (`modes.spec.ts`) fails if a command is missing from the list
// or is listed with a different kind. Add each new tool in both places.

/** @typedef {"read" | "write" | "destructive" | "playtest" | "review"} ToolKind */
/** @typedef {"ask" | "plan" | "build" | "test" | "review"} Mode */

/** @type {Record<string, ToolKind>} */
export const TOOL_KINDS = {
  get_scene: "read",
  get_scenario: "read",
  get_selection: "read",
  find_components: "read",
  list_library: "read",
  run_checks: "read",
  select: "read",

  add_shape: "write",
  add_text: "write",
  add_button: "write",
  add_library_item: "write",
  set_style: "write",
  set_text: "write",
  set_text_style: "write",
  move: "write",
  resize: "write",
  rotate: "write",
  align: "write",
  distribute: "write",
  place_relative: "write",
  layer: "write",
  set_conditional_destination: "write",

  delete_components: "destructive",
};

/**
 * The kinds of tool each mode may use. Plan allows writes and deletes because
 * it proposes them: the editor only applies them once the author approves.
 *
 * @type {Record<Mode, ToolKind[]>}
 */
export const MODE_KINDS = {
  ask: ["read"],
  plan: ["read", "write", "destructive"],
  build: ["read", "write", "destructive"],
  test: ["read", "playtest"],
  review: ["read", "review"],
};

export const MODES = /** @type {Mode[]} */ (Object.keys(MODE_KINDS));

export function isMode(value) {
  return typeof value === "string" && Object.hasOwn(MODE_KINDS, value);
}

/** Whether a tool is one we have at all. */
export function isKnownTool(name) {
  return typeof name === "string" && Object.hasOwn(TOOL_KINDS, name);
}

/** Whether `mode` may use the tool called `name`. */
export function isToolAllowed(mode, name) {
  return (
    isMode(mode) &&
    isKnownTool(name) &&
    MODE_KINDS[mode].includes(TOOL_KINDS[name])
  );
}

/** The names of the tools `mode` may use. */
export function toolsFor(mode) {
  return Object.keys(TOOL_KINDS).filter((name) => isToolAllowed(mode, name));
}
