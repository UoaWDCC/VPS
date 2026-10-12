import type { Component } from "../types";
import { contrastRatio, parseColor } from "./colors";
import { defineCommand } from "./define";
import {
  resolveComponent,
  resolveComponents,
  describeComponent,
} from "./resolve";
import * as s from "./schemas";
import { giveText } from "./build";
import { getDocument, textColorOf, withText } from "./text";
import { CommandError, type Command } from "./types";

// Commands that change how things look or what they say.

type Loose = Record<string, unknown>;

const FILLABLE = ["box", "ellipse", "speech", "textbox"];
const STROKED = [...FILLABLE, "line"];
const HOLDS_TEXT = FILLABLE;

interface StyleArgs {
  targets: string[];
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

const setStyle = defineCommand<StyleArgs>({
  name: "set_style",
  description:
    "Change the fill colour, outline colour and/or outline width of shapes and text boxes. Lines have an outline only. Use 'transparent' to clear a colour.",
  kind: "write",
  schema: {
    required: ["targets"],
    anyOf: [
      { required: ["fill"] },
      { required: ["stroke"] },
      { required: ["strokeWidth"] },
    ],
    properties: {
      targets: s.targets,
      fill: s.color,
      stroke: s.color,
      strokeWidth: { type: "number", minimum: 0, maximum: 50 },
    },
  },
  run: ({ scene, args, world }) => {
    const next = structuredClone(scene);
    const chosen = resolveComponents(next, args.targets, world);
    const warnings: string[] = [];
    const fill = args.fill ? parseColor(args.fill) : undefined;
    const stroke = args.stroke ? parseColor(args.stroke) : undefined;
    const changed: string[] = [];

    for (const component of chosen) {
      const target = next.components[component.id] as Component & Loose;
      let touched = false;

      if (fill !== undefined) {
        if (FILLABLE.includes(target.type)) {
          target.fill = fill;
          touched = true;
        } else
          warnings.push(
            `${describeComponent(target)} has no fill, so it was left alone.`
          );
      }
      if (stroke !== undefined || args.strokeWidth !== undefined) {
        if (STROKED.includes(target.type)) {
          if (stroke !== undefined) target.stroke = stroke;
          if (args.strokeWidth !== undefined)
            target.strokeWidth = args.strokeWidth;
          touched = true;
        } else
          warnings.push(
            `${describeComponent(target)} has no outline, so it was left alone.`
          );
      }

      if (touched) {
        changed.push(describeComponent(target));
        const text = textColorOf(target);
        const opaque = fill && !fill.endsWith("00") ? fill.slice(0, 7) : null;
        if (
          opaque &&
          text &&
          getDocument(target) &&
          contrastRatio(text, opaque) < 3
        )
          warnings.push(
            `Text on ${describeComponent(target)} is hard to read on that fill; change its colour with set_text_style.`
          );
      }
    }

    if (!changed.length)
      throw new CommandError(
        `Nothing to change: ${warnings.join(" ") || "none of those components can take that style."}`
      );

    return {
      scene: next,
      warnings,
      summary: `Restyled ${changed.join(", ")}.`,
    };
  },
});

interface TextArgs {
  target: string;
  text: string;
}

const setText = defineCommand<TextArgs>({
  name: "set_text",
  description:
    "Replace the text in a shape or text box, keeping its font, size and colour. Use \\n for new lines, and $$name$$ to show a property's value. Replaces everything, including any property chips that were there.",
  kind: "write",
  schema: {
    required: ["target", "text"],
    properties: { target: s.target, text: { type: "string" } },
  },
  run: ({ scene, args, world }) => {
    const next = structuredClone(scene);
    const found = resolveComponent(next, args.target, world);
    const component = next.components[found.id] as Component & Loose;

    if (!HOLDS_TEXT.includes(component.type))
      throw new CommandError(
        `${describeComponent(component)} can't hold text. Boxes, ellipses, speech bubbles and text boxes can.`
      );

    if (getDocument(component))
      component.document = withText(component, args.text);
    else giveText(component, args.text);

    return {
      scene: next,
      summary: `Set the text of ${describeComponent(component)}.`,
    };
  },
});

interface TextStyleArgs {
  targets: string[];
  fontFamily?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  align?: "left" | "center" | "right";
  lineHeight?: number;
}

const SPAN_KEYS = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "textDecoration",
  "textColor",
];
const BLOCK_KEYS = ["alignment", "lineHeight"];

const setTextStyle = defineCommand<TextStyleArgs>({
  name: "set_text_style",
  description:
    "Change how the text in shapes and text boxes looks: font, size, bold, italic, underline, colour, alignment, line spacing. Applies to all the text in each target.",
  kind: "write",
  schema: {
    required: ["targets"],
    properties: {
      targets: s.targets,
      fontFamily: { type: "string", enum: s.FONT_FAMILIES },
      fontSize: { type: "number", minimum: 6, maximum: 400 },
      bold: { type: "boolean" },
      italic: { type: "boolean" },
      underline: { type: "boolean" },
      color: s.color,
      align: { type: "string", enum: ["left", "center", "right"] },
      lineHeight: { type: "number", minimum: 0.8, maximum: 3 },
    },
  },
  run: ({ scene, args, world }) => {
    const next = structuredClone(scene);
    const warnings: string[] = [];
    const style: Loose = {};

    if (args.fontFamily) style.fontFamily = args.fontFamily;
    if (args.fontSize) style.fontSize = args.fontSize;
    if (args.bold !== undefined)
      style.fontWeight = args.bold ? "bold" : "normal";
    if (args.italic !== undefined)
      style.fontStyle = args.italic ? "italic" : "normal";
    if (args.underline !== undefined)
      style.textDecoration = args.underline ? "underline" : "none";
    if (args.color) style.textColor = parseColor(args.color).slice(0, 7);
    if (args.align) style.alignment = args.align;
    if (args.lineHeight) style.lineHeight = args.lineHeight;

    if (!Object.keys(style).length)
      throw new CommandError("Say what to change: font, size, bold, colour...");

    const done: string[] = [];
    for (const found of resolveComponents(next, args.targets, world)) {
      const component = next.components[found.id] as Component & Loose;
      const document = component.document as
        | {
            style: Loose;
            blocks: { style?: Loose; spans: { style?: Loose }[] }[];
          }
        | undefined;

      if (!document) {
        warnings.push(
          `${describeComponent(component)} has no text, so it was left alone.`
        );
        continue;
      }

      // styles set on a span or block win over the base style, so setting
      // the base alone wouldn't change text that was styled individually
      document.style = { ...document.style, ...style };
      for (const block of document.blocks) {
        BLOCK_KEYS.forEach(
          (key) => key in style && block.style && delete block.style[key]
        );
        for (const span of block.spans)
          SPAN_KEYS.forEach(
            (key) => key in style && span.style && delete span.style[key]
          );
      }
      done.push(describeComponent(component));
    }

    if (!done.length)
      throw new CommandError(`Nothing to change: ${warnings.join(" ")}`);

    return {
      scene: next,
      warnings,
      summary: `Restyled the text of ${done.join(", ")}.`,
    };
  },
});

export const styleCommands: Command[] = [setStyle, setText, setTextStyle];
