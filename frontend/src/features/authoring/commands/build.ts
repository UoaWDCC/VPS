import { v4 } from "uuid";
import { buttonComponent } from "../library/buttonComponent.js";
import {
  BUTTON_PRESETS,
  BUTTON_SIZE,
  IMAGE_PRESET_SIZE,
  type PresetItem,
} from "../library/presets.js";
import { defaults } from "../scene/defaults";
import type { Component, Scene, Vec2 } from "../types";
import { parseColor, readableTextColor } from "./colors";
import { hasFrame, setFrame, type Frame } from "./geometry";
import { buildDocument } from "./text";
import type { World } from "./types";

// Making new components. They're built from the same starting properties the
// editor uses when an author draws one by hand, so they behave identically.

type Canvas = World["canvas"];
type Loose = Record<string, unknown>;

/** One above everything already on the canvas. */
export function nextZIndex(scene: Scene) {
  const stack = Object.values(scene.components)
    .filter(hasFrame)
    .map((c) => c.zIndex ?? 0);
  return stack.length ? Math.max(...stack) + 1 : 0;
}

/** A box of the given size: where it was asked to go, else the canvas centre. */
export function placeFrame(
  canvas: Canvas,
  size: { width: number; height: number },
  at: { x?: number; y?: number } = {}
): Frame {
  return {
    width: size.width,
    height: size.height,
    x: at.x ?? Math.round((canvas.width - size.width) / 2),
    y: at.y ?? Math.round((canvas.height - size.height) / 2),
  };
}

const SPEECH_TAIL = 20;

function vertsFor(type: string, frame: Frame): Vec2[] {
  const topLeft = { x: frame.x, y: frame.y };
  const bottomRight = { x: frame.x + frame.width, y: frame.y + frame.height };
  // a speech bubble's third point is its tail, just below the bottom right
  return type === "speech"
    ? [
        topLeft,
        bottomRight,
        { x: bottomRight.x, y: bottomRight.y + SPEECH_TAIL },
      ]
    : [topLeft, bottomRight];
}

export type ShapeType = "box" | "ellipse" | "speech" | "line" | "textbox";

/** A component with the editor's defaults for its type, at a place and size. */
export function createComponent(
  type: ShapeType,
  frame: Frame,
  scene: Scene
): Component {
  const base = structuredClone(defaults[type]) as Loose;
  const bounds = base.bounds as { verts: Vec2[]; rotation?: number };
  base.id = v4();
  base.zIndex = nextZIndex(scene);
  bounds.verts = vertsFor(type, frame);
  return base as unknown as Component;
}

interface TextOptions {
  fontSize?: number;
  /** A colour name or hex; chosen to read on the fill if left out. */
  color?: string;
  bold?: boolean;
  italic?: boolean;
  align?: "left" | "center" | "right";
}

/** Puts text in a shape or text box, styled as asked. */
export function giveText(
  component: Component,
  text: string,
  options: TextOptions = {}
) {
  const fill = (component as unknown as Loose).fill as string | undefined;
  const document = buildDocument(text, {
    style: {
      ...(options.fontSize && { fontSize: options.fontSize }),
      textColor: options.color
        ? parseColor(options.color).slice(0, 7)
        : component.type === "textbox"
          ? "#000000"
          : readableTextColor(fill),
      ...(options.bold && { fontWeight: "bold" as const }),
      ...(options.italic && { fontStyle: "italic" as const }),
    },
    blockStyle: {
      alignment:
        options.align ?? (component.type === "textbox" ? "left" : "center"),
    },
  });
  (component as unknown as Loose).document = document;
}

/** A preset button, possibly adjusted. */
export function createButton(
  scene: Scene,
  canvas: Canvas,
  options: {
    presetId?: string;
    label?: string;
    at?: { x?: number; y?: number };
    size?: { width?: number; height?: number };
    fill?: string;
    textColor?: string;
    shape?: "box" | "ellipse";
  } = {}
): Component {
  const preset =
    BUTTON_PRESETS.find((p) => p.id === options.presetId) ?? BUTTON_PRESETS[0];

  const button = buttonComponent(preset, {
    id: v4(),
    zIndex: nextZIndex(scene),
    canvas,
  }) as unknown as Component & Loose;

  if (options.shape) button.type = options.shape;
  if (options.label !== undefined) giveButtonLabel(button, options.label);
  if (options.fill) {
    button.fill = parseColor(options.fill);
    // the preset's own text colour was chosen for the preset's own fill
    if (!options.textColor)
      setTextColor(button, readableTextColor(button.fill as string));
  }
  if (options.textColor)
    setTextColor(button, parseColor(options.textColor).slice(0, 7));

  const frame = placeFrame(
    canvas,
    {
      width: options.size?.width ?? BUTTON_SIZE.width,
      height: options.size?.height ?? BUTTON_SIZE.height,
    },
    options.at
  );
  setFrame(button, frame);
  return button;
}

function giveButtonLabel(button: Loose, label: string) {
  const document = button.document as {
    blocks: { spans: { text: string }[] }[];
  };
  document.blocks[0].spans[0].text = label;
}

function setTextColor(component: Loose, color: string) {
  (component.document as { style: Loose }).style.textColor = color;
}

/** A library preset as a component: a button, an icon, or a sound. */
export function createLibraryComponent(
  item: PresetItem,
  scene: Scene,
  canvas: Canvas,
  at: { x?: number; y?: number; width?: number } = {}
): Component {
  if (item.kind === "button")
    return createButton(scene, canvas, {
      presetId: item.id,
      at,
      size: at.width ? { width: at.width } : undefined,
    });

  if (item.kind === "audio")
    return {
      id: v4(),
      type: "audio",
      name: item.name,
      url: item.url,
      loop: item.loops,
    } as unknown as Component;

  // icons are square; a width scales them
  const side = Math.min(at.width ?? IMAGE_PRESET_SIZE, canvas.height);
  const frame = placeFrame(canvas, { width: side, height: side }, at);

  const image = structuredClone(defaults.image) as unknown as Loose;
  image.id = v4();
  image.zIndex = nextZIndex(scene);
  image.bounds = { verts: vertsFor("box", frame), rotation: 0 };
  image.href = item.url;
  return image as unknown as Component;
}
