import type { JsonSchema } from "./types";

// Pieces of schema several commands share.

export const targets: JsonSchema = {
  type: "array",
  items: { type: "string", minLength: 1 },
  minItems: 1,
  description:
    "Components to act on. Each is an id from get_scene (the first few characters are enough), the word 'selected' for what's selected now, or the exact text a component shows.",
};

export const target: JsonSchema = {
  type: "string",
  minLength: 1,
  description:
    "One component: an id from get_scene (or the start of one), 'selected', or the exact text it shows.",
};

export const colorText =
  "A hex code like #0080a7, 'transparent', or a name such as red, blue, accent, success, warning, error, info, neutral.";

export const color: JsonSchema = {
  type: "string",
  description: colorText,
};

export const position = (what: string): JsonSchema => ({
  type: "number",
  description: what,
});

export const FONT_FAMILIES = [
  "Arial",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Times New Roman",
  "Georgia",
  "Garamond",
  "Courier New",
  "Helvetica",
];
