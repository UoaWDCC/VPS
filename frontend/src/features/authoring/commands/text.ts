import type {
  BaseTextStyle,
  Component,
  ModelBlock,
  ModelDocument,
} from "../types";
import { getFrame, hasFrame } from "./geometry";

// Reading and building the text inside shapes and text boxes.

type TextStyle = Partial<BaseTextStyle>;

export type Documented = Component & {
  document?: Omit<ModelDocument, "bounds" | "id">;
};

export function getDocument(component: Component) {
  return (component as Documented).document ?? null;
}

/**
 * What a component reads as plain text. Property chips show as $$name$$, the
 * form the play page substitutes, and blocks are separate lines.
 */
export function componentText(component: Component) {
  const document = getDocument(component);
  if (!document) return "";
  return document.blocks
    .map((block) =>
      block.spans
        .map((span) =>
          span.property ? `$$${span.property.displayName}$$` : span.text
        )
        .join("")
    )
    .join("\n");
}

/**
 * A document of the given text, one block per line. It keeps the first block's
 * and span's style so replacing words doesn't reset how they look.
 */
export function buildDocument(
  text: string,
  base: {
    style?: TextStyle;
    blockStyle?: ModelBlock["style"];
    spanStyle?: ModelBlock["spans"][number]["style"];
  } = {}
) {
  return {
    type: "text" as const,
    style: base.style ?? {},
    blocks: text.split("\n").map((line) => ({
      style: { ...(base.blockStyle ?? {}) },
      spans: [{ style: { ...(base.spanStyle ?? {}) }, text: line }],
    })),
  };
}

/** The same document with `text` in place of what it said. */
export function withText(component: Component, text: string) {
  const document = getDocument(component);
  const firstBlock = document?.blocks[0];
  return buildDocument(text, {
    style: document?.style,
    blockStyle: firstBlock?.style,
    spanStyle: firstBlock?.spans[0]?.style,
  });
}

const DEFAULT_FONT_SIZE = 24;
const DEFAULT_LINE_HEIGHT = 1.1;

/** The font size text is drawn at: the first span's own, else the base style. */
export function fontSizeOf(component: Component) {
  const document = getDocument(component);
  const spanSize = document?.blocks[0]?.spans[0]?.style?.fontSize;
  return Number(spanSize ?? document?.style?.fontSize ?? DEFAULT_FONT_SIZE);
}

function isBold(component: Component) {
  const document = getDocument(component);
  const span = document?.blocks[0]?.spans[0]?.style?.fontWeight;
  return (span ?? document?.style?.fontWeight) === "bold";
}

function lineHeightOf(component: Component) {
  const document = getDocument(component);
  return (
    document?.blocks[0]?.style?.lineHeight ??
    document?.style?.lineHeight ??
    DEFAULT_LINE_HEIGHT
  );
}

/**
 * About how tall the text will be inside a box of the given width. The real
 * layout needs a canvas to measure with, which commands can't have, so this
 * estimates from the font size: close enough to warn "this won't fit".
 */
export function estimateTextHeight(component: Component, boxWidth: number) {
  const document = getDocument(component);
  if (!document) return 0;

  const size = fontSizeOf(component);
  const charWidth = size * (isBold(component) ? 0.6 : 0.55);
  const perLine = Math.max(1, Math.floor(boxWidth / charWidth));

  const lines = componentText(component)
    .split("\n")
    .reduce(
      (total, line) => total + Math.max(1, Math.ceil(line.length / perLine)),
      0
    );

  return Math.ceil(lines * size * lineHeightOf(component));
}

/** The padding between a component's edge and its text. */
export function paddingOf(component: Component) {
  return (component as { padding?: number }).padding ?? 0;
}

/**
 * Room for text inside a component, and what the text is estimated to need.
 * Nothing if the component has no text or no place on the canvas.
 */
export function textFit(component: Component) {
  if (!hasFrame(component) || !componentText(component)) return null;

  const frame = getFrame(component);
  const padding = paddingOf(component);
  const width = Math.max(0, frame.width - padding * 2);
  return {
    available: Math.max(0, frame.height - padding * 2),
    needed: estimateTextHeight(component, width),
  };
}

/** The colour a component's text is drawn in (black unless set). */
export function textColorOf(component: Component) {
  const document = getDocument(component);
  if (!document) return null;
  return (
    document.blocks[0]?.spans[0]?.style?.textColor ??
    document.style?.textColor ??
    "#000000"
  );
}
