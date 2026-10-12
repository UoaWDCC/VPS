import { BUTTON_PRESETS, PRESET_ITEMS } from "../library/presets.js";
import {
  createButton,
  createComponent,
  createLibraryComponent,
  giveText,
  placeFrame,
} from "./build";
import { parseColor } from "./colors";
import { defineCommand } from "./define";
import { setFrame } from "./geometry";
import { estimateTextHeight } from "./text";
import { shortId } from "./resolve";
import * as s from "./schemas";
import { CommandError, type Command, type CommandOutcome } from "./types";
import type { Component, Scene } from "../types";

// Commands that put something new on the canvas. Each selects what it made,
// so the next command can say "selected".

function added(scene: Scene, components: Component[]): CommandOutcome {
  const next = structuredClone(scene);
  components.forEach((c) => (next.components[c.id] = c));
  const placed = components.map((c) => ({ id: shortId(c.id), type: c.type }));
  return {
    scene: next,
    select: components.filter((c) => c.type !== "audio").map((c) => c.id),
    output: { created: placed },
    summary: `Added ${placed.map((p) => `${p.type} ${p.id}`).join(", ")}.`,
  };
}

interface ShapeArgs {
  shape: "box" | "ellipse" | "speech" | "line";
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  textColor?: string;
  fontSize?: number;
}

const addShape = defineCommand<ShapeArgs>({
  name: "add_shape",
  description:
    "Draw a shape on the canvas: a box (rectangle), ellipse, speech bubble, or a line. x and y are the top left; leave them out to centre it. A line runs from the top left to the bottom right of its box (height 0 makes it horizontal). Boxes, ellipses and speech bubbles can hold text.",
  kind: "write",
  schema: {
    required: ["shape"],
    properties: {
      shape: { type: "string", enum: ["box", "ellipse", "speech", "line"] },
      x: s.position("Distance of the left edge from the left of the canvas."),
      y: s.position("Distance of the top edge from the top of the canvas."),
      width: { type: "number", exclusiveMinimum: 0 },
      height: { type: "number", minimum: 0 },
      fill: s.color,
      stroke: s.color,
      strokeWidth: { type: "number", minimum: 0, maximum: 50 },
      text: {
        type: "string",
        description:
          "Text inside the shape. Write $$name$$ to show a property's value.",
      },
      textColor: s.color,
      fontSize: { type: "number", minimum: 6, maximum: 400 },
    },
  },
  run: ({ scene, args, world }) => {
    const isLine = args.shape === "line";
    const frame = placeFrame(
      world.canvas,
      {
        width: args.width ?? 300,
        height: args.height ?? (isLine ? 0 : 200),
      },
      args
    );
    const shape = createComponent(args.shape, frame, scene) as Component &
      Record<string, unknown>;

    if (args.fill) {
      if (isLine) throw new CommandError("A line has no fill; use stroke.");
      shape.fill = parseColor(args.fill);
    }
    if (args.stroke) shape.stroke = parseColor(args.stroke);
    if (args.strokeWidth !== undefined) shape.strokeWidth = args.strokeWidth;

    if (args.text) {
      if (isLine) throw new CommandError("A line can't hold text.");
      giveText(shape, args.text, {
        color: args.textColor,
        fontSize: args.fontSize,
      });
    }
    return added(scene, [shape]);
  },
});

interface TextArgs {
  text: string;
  x?: number;
  y?: number;
  width?: number;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  align?: "left" | "center" | "right";
}

const addText = defineCommand<TextArgs>({
  name: "add_text",
  description:
    "Add a text box. Its height is worked out from the text, so give it a width (default 600) and let it grow. Use \\n for new lines, and $$name$$ to show a property's value (for example 'Heart rate: $$heartRate$$').",
  kind: "write",
  schema: {
    required: ["text"],
    properties: {
      text: { type: "string", minLength: 1 },
      x: s.position("Left edge."),
      y: s.position("Top edge."),
      width: { type: "number", exclusiveMinimum: 0 },
      fontSize: { type: "number", minimum: 6, maximum: 400 },
      color: s.color,
      bold: { type: "boolean" },
      italic: { type: "boolean" },
      align: { type: "string", enum: ["left", "center", "right"] },
    },
  },
  run: ({ scene, args, world }) => {
    const width = args.width ?? 600;
    const probe = createComponent(
      "textbox",
      placeFrame(world.canvas, { width, height: 100 }, args),
      scene
    );
    giveText(probe, args.text, args);

    // textboxes don't resize themselves, so give it room for what it says
    const padding = (probe as { padding?: number }).padding ?? 0;
    const height = Math.max(
      60,
      estimateTextHeight(probe, width - padding * 2) + padding * 2
    );
    setFrame(probe, { height });
    if (args.y === undefined)
      setFrame(probe, { y: Math.round((world.canvas.height - height) / 2) });

    return added(scene, [probe]);
  },
});

interface ButtonArgs {
  preset?: string;
  label?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  textColor?: string;
  shape?: "box" | "ellipse";
}

const addButton = defineCommand<ButtonArgs>({
  name: "add_button",
  description:
    "Add a styled button from the library (or one styled to your own colours). It's a shape with text; to make it do something, give it a destination or property changes afterwards. Presets: " +
    BUTTON_PRESETS.map((p) => `${p.id} ("${p.label}")`).join(", ") +
    ".",
  kind: "write",
  schema: {
    properties: {
      preset: {
        type: "string",
        enum: BUTTON_PRESETS.map((p) => p.id),
        description: "Which look to start from. Defaults to button-primary.",
      },
      label: { type: "string", description: "The words on the button." },
      x: s.position("Left edge; leave out to centre."),
      y: s.position("Top edge; leave out to centre."),
      width: { type: "number", exclusiveMinimum: 0 },
      height: { type: "number", exclusiveMinimum: 0 },
      fill: { ...s.color, description: `Override the fill. ${s.colorText}` },
      textColor: s.color,
      shape: { type: "string", enum: ["box", "ellipse"] },
    },
  },
  run: ({ scene, args, world }) => {
    const button = createButton(scene, world.canvas, {
      presetId: args.preset,
      label: args.label,
      at: args,
      size: args,
      fill: args.fill,
      textColor: args.textColor,
      shape: args.shape,
    });
    return added(scene, [button]);
  },
});

interface LibraryArgs {
  itemId: string;
  x?: number;
  y?: number;
  width?: number;
}

const libraryIds = PRESET_ITEMS.map((item) => item.id);

const addLibraryItem = defineCommand<LibraryArgs>({
  name: "add_library_item",
  description:
    "Add something from the built-in asset library: a button, an icon (placed at 512px, or give a width) or a sound (which goes in the scene's audio, not on the canvas). Find ids with list_library.",
  kind: "write",
  schema: {
    required: ["itemId"],
    properties: {
      itemId: { type: "string", enum: libraryIds },
      x: s.position("Left edge; leave out to centre."),
      y: s.position("Top edge; leave out to centre."),
      width: {
        type: "number",
        exclusiveMinimum: 0,
        description: "Width (and height, for icons) to scale to.",
      },
    },
  },
  run: ({ scene, args, world }) => {
    const item = PRESET_ITEMS.find((p) => p.id === args.itemId);
    if (!item)
      throw new CommandError(
        `No library item "${args.itemId}". Use list_library to find one.`
      );
    return added(scene, [
      createLibraryComponent(item, scene, world.canvas, args),
    ]);
  },
});

export const addCommands: Command[] = [
  addShape,
  addText,
  addButton,
  addLibraryItem,
];
