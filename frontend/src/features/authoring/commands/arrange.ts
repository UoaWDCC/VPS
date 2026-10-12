import { computeLayerChanges } from "../scene/layers";
import type { Component, Scene } from "../types";
import {
  canRotate,
  getFrame,
  hasFrame,
  setFrame,
  setRotation,
  unionFrame,
  type Frame,
} from "./geometry";
import { defineCommand } from "./define";
import {
  describeComponent,
  resolveComponent,
  resolveComponents,
} from "./resolve";
import * as s from "./schemas";
import { CommandError, type Command, type World } from "./types";

// Commands about where things are and how they stack. All of them work in
// canvas pixels, with x and y the top left of a component's box.

/** Targets that can actually be placed; audio can't, say. */
function placeable(
  scene: Scene,
  refs: string[],
  world: Pick<World, "selection" | "openSceneId">,
  warnings: string[]
) {
  const found = resolveComponents(scene, refs, world);
  const placed = found.filter(hasFrame);
  found
    .filter((c) => !hasFrame(c))
    .forEach((c) =>
      warnings.push(
        `${describeComponent(c)} has no place on the canvas, so it was left alone.`
      )
    );
  if (!placed.length)
    throw new CommandError(
      "None of those components have a place on the canvas."
    );
  return placed;
}

const live = (scene: Scene, component: Component) =>
  scene.components[component.id];

const frameOf = (component: Component) =>
  getFrame(component as Parameters<typeof getFrame>[0]);

interface MoveArgs {
  targets: string[];
  dx?: number;
  dy?: number;
  x?: number;
  y?: number;
}

const move = defineCommand<MoveArgs>({
  name: "move",
  description:
    "Move components. Either by an amount (dx to the right, dy down; negative goes left and up) or to a position (x and y, the top left; several targets move together as a group, keeping their spacing). Use one style or the other.",
  kind: "write",
  schema: {
    required: ["targets"],
    properties: {
      targets: s.targets,
      dx: { type: "number" },
      dy: { type: "number" },
      x: { type: "number" },
      y: { type: "number" },
    },
  },
  run: ({ scene, args, world }) => {
    const relative = args.dx !== undefined || args.dy !== undefined;
    const absolute = args.x !== undefined || args.y !== undefined;
    if (relative === absolute)
      throw new CommandError(
        "Give either dx/dy or x/y, not both and not neither."
      );

    const next = structuredClone(scene);
    const warnings: string[] = [];
    const chosen = placeable(next, args.targets, world, warnings);

    const group = unionFrame(chosen.map(frameOf));
    const shift = relative
      ? { x: args.dx ?? 0, y: args.dy ?? 0 }
      : {
          x: args.x === undefined ? 0 : args.x - group.x,
          y: args.y === undefined ? 0 : args.y - group.y,
        };

    chosen.forEach((component) => {
      const frame = frameOf(component);
      setFrame(live(next, component), {
        x: frame.x + shift.x,
        y: frame.y + shift.y,
      });
    });

    return {
      scene: next,
      warnings,
      summary: `Moved ${chosen.map(describeComponent).join(", ")} by ${Math.round(shift.x)}, ${Math.round(shift.y)}.`,
    };
  },
});

interface ResizeArgs {
  targets: string[];
  width?: number;
  height?: number;
  scale?: number;
  keepAspectRatio?: boolean;
}

const resize = defineCommand<ResizeArgs>({
  name: "resize",
  description:
    "Change the size of components, keeping their top left corner in place. Give width and/or height in pixels, or a scale factor (2 doubles it). With keepAspectRatio, giving only a width or height scales the other to match.",
  kind: "write",
  schema: {
    required: ["targets"],
    properties: {
      targets: s.targets,
      width: { type: "number", exclusiveMinimum: 0 },
      height: { type: "number", exclusiveMinimum: 0 },
      scale: { type: "number", exclusiveMinimum: 0 },
      keepAspectRatio: { type: "boolean" },
    },
  },
  run: ({ scene, args, world }) => {
    if (
      args.width === undefined &&
      args.height === undefined &&
      args.scale === undefined
    )
      throw new CommandError("Give a width, a height or a scale.");

    const next = structuredClone(scene);
    const warnings: string[] = [];
    const chosen = placeable(next, args.targets, world, warnings);

    chosen.forEach((component) => {
      const frame = frameOf(component);
      let width = args.width ?? frame.width;
      let height = args.height ?? frame.height;

      if (args.scale !== undefined) {
        width = frame.width * args.scale;
        height = frame.height * args.scale;
      } else if (args.keepAspectRatio && frame.width && frame.height) {
        if (args.width !== undefined && args.height === undefined)
          height = (args.width / frame.width) * frame.height;
        if (args.height !== undefined && args.width === undefined)
          width = (args.height / frame.height) * frame.width;
      }
      setFrame(live(next, component), { width, height });
    });

    return {
      scene: next,
      warnings,
      summary: `Resized ${chosen.map(describeComponent).join(", ")}.`,
    };
  },
});

interface RotateArgs {
  targets: string[];
  degrees: number;
  relative?: boolean;
}

const rotate = defineCommand<RotateArgs>({
  name: "rotate",
  description:
    "Rotate components, in degrees clockwise. By default sets the angle; with relative it turns them by that much from where they are. Lines can't be rotated (move their ends with resize and move instead).",
  kind: "write",
  schema: {
    required: ["targets", "degrees"],
    properties: {
      targets: s.targets,
      degrees: { type: "number" },
      relative: { type: "boolean" },
    },
  },
  run: ({ scene, args, world }) => {
    const next = structuredClone(scene);
    const warnings: string[] = [];
    const chosen = placeable(next, args.targets, world, warnings).filter(
      (c) => {
        if (canRotate(c)) return true;
        warnings.push(`${describeComponent(c)} can't be rotated.`);
        return false;
      }
    );
    if (!chosen.length) throw new CommandError(warnings.join(" "));

    chosen.forEach((component) => {
      const target = live(next, component);
      const current =
        (target as { bounds: { rotation?: number } }).bounds.rotation ?? 0;
      const degrees = args.relative ? current + args.degrees : args.degrees;
      setRotation(target, ((degrees % 360) + 360) % 360);
    });

    return {
      scene: next,
      warnings,
      summary: `Rotated ${chosen.map(describeComponent).join(", ")}.`,
    };
  },
});

const ALIGNMENTS = [
  "left",
  "center",
  "right",
  "top",
  "middle",
  "bottom",
] as const;
type Alignment = (typeof ALIGNMENTS)[number];

interface AlignArgs {
  targets: string[];
  alignment: Alignment;
  relativeTo?: "selection" | "canvas";
}

const align = defineCommand<AlignArgs>({
  name: "align",
  description:
    "Line components up along an edge or centre: left, center (horizontal centre), right, top, middle (vertical centre), bottom. Lines them up with each other, or with the canvas (the default when there's only one target).",
  kind: "write",
  schema: {
    required: ["targets", "alignment"],
    properties: {
      targets: s.targets,
      alignment: { type: "string", enum: [...ALIGNMENTS] },
      relativeTo: {
        type: "string",
        enum: ["selection", "canvas"],
        description:
          "What to line up against: the targets themselves, or the canvas.",
      },
    },
  },
  run: ({ scene, args, world }) => {
    const next = structuredClone(scene);
    const warnings: string[] = [];
    const chosen = placeable(next, args.targets, world, warnings);

    const toCanvas =
      (args.relativeTo ?? (chosen.length > 1 ? "selection" : "canvas")) ===
      "canvas";
    const reference: Frame = toCanvas
      ? { x: 0, y: 0, ...world.canvas }
      : unionFrame(chosen.map(frameOf));

    chosen.forEach((component) => {
      const { width, height } = frameOf(component);
      const place: Record<Alignment, Partial<Frame>> = {
        left: { x: reference.x },
        center: { x: reference.x + (reference.width - width) / 2 },
        right: { x: reference.x + reference.width - width },
        top: { y: reference.y },
        middle: { y: reference.y + (reference.height - height) / 2 },
        bottom: { y: reference.y + reference.height - height },
      };
      setFrame(live(next, component), place[args.alignment]);
    });

    return {
      scene: next,
      warnings,
      summary: `Aligned ${chosen.length} component${chosen.length === 1 ? "" : "s"} (${args.alignment}) to the ${toCanvas ? "canvas" : "group"}.`,
    };
  },
});

interface DistributeArgs {
  targets: string[];
  direction: "horizontal" | "vertical";
  gap?: number;
}

const distribute = defineCommand<DistributeArgs>({
  name: "distribute",
  description:
    "Space components out evenly in a row (horizontal) or column (vertical). Without gap, the first and last stay where they are and the rest are spread between them (needs 3 or more). With gap, they're packed with exactly that many pixels between, starting from the first.",
  kind: "write",
  schema: {
    required: ["targets", "direction"],
    properties: {
      targets: s.targets,
      direction: { type: "string", enum: ["horizontal", "vertical"] },
      gap: { type: "number", minimum: 0 },
    },
  },
  run: ({ scene, args, world }) => {
    const next = structuredClone(scene);
    const warnings: string[] = [];
    const chosen = placeable(next, args.targets, world, warnings);
    if (chosen.length < 2)
      throw new CommandError("Distributing needs at least 2 components.");
    if (args.gap === undefined && chosen.length < 3)
      throw new CommandError(
        "Spreading evenly needs 3 or more components, or give a gap."
      );

    const axis = args.direction === "horizontal" ? "x" : "y";
    const size = args.direction === "horizontal" ? "width" : "height";

    const ordered = chosen
      .map((component) => ({ component, frame: frameOf(component) }))
      .sort((a, b) => a.frame[axis] - b.frame[axis]);

    const first = ordered[0].frame[axis];
    const last = ordered[ordered.length - 1].frame;
    const gap =
      args.gap ??
      (last[axis] +
        last[size] -
        first -
        ordered.reduce((sum, o) => sum + o.frame[size], 0)) /
        (ordered.length - 1);

    let position = first;
    ordered.forEach(({ component, frame }) => {
      setFrame(live(next, component), { [axis]: position });
      position += frame[size] + gap;
    });

    return {
      scene: next,
      warnings,
      summary: `Distributed ${ordered.length} components ${args.direction}ly with ${Math.round(gap)}px between.`,
    };
  },
});

interface PlaceArgs {
  target: string;
  anchor: string;
  position: "below" | "above" | "left-of" | "right-of";
  gap?: number;
  align?: "start" | "center" | "end";
}

const placeRelative = defineCommand<PlaceArgs>({
  name: "place_relative",
  description:
    "Put one component next to another: below, above, left-of or right-of, with a gap (default 24px). align says how they line up on the other axis: start (left or top edges), center, or end.",
  kind: "write",
  schema: {
    required: ["target", "anchor", "position"],
    properties: {
      target: s.target,
      anchor: {
        ...s.target,
        description: "The component to place it next to.",
      },
      position: {
        type: "string",
        enum: ["below", "above", "left-of", "right-of"],
      },
      gap: { type: "number", minimum: 0 },
      align: { type: "string", enum: ["start", "center", "end"] },
    },
  },
  run: ({ scene, args, world }) => {
    const next = structuredClone(scene);
    const moving = resolveComponent(next, args.target, world);
    const anchor = resolveComponent(next, args.anchor, world);
    if (moving.id === anchor.id)
      throw new CommandError("A component can't be placed next to itself.");
    if (!hasFrame(moving) || !hasFrame(anchor))
      throw new CommandError("Both components need a place on the canvas.");

    const a = frameOf(anchor);
    const m = frameOf(moving);
    const gap = args.gap ?? 24;
    const how = args.align ?? "center";
    const across = (start: number, anchorSize: number, size: number) =>
      how === "start"
        ? start
        : how === "end"
          ? start + anchorSize - size
          : start + (anchorSize - size) / 2;

    const place: Record<PlaceArgs["position"], Partial<Frame>> = {
      below: { y: a.y + a.height + gap, x: across(a.x, a.width, m.width) },
      above: { y: a.y - m.height - gap, x: across(a.x, a.width, m.width) },
      "right-of": {
        x: a.x + a.width + gap,
        y: across(a.y, a.height, m.height),
      },
      "left-of": { x: a.x - m.width - gap, y: across(a.y, a.height, m.height) },
    };
    setFrame(live(next, moving), place[args.position]);

    return {
      scene: next,
      summary: `Placed ${describeComponent(moving)} ${args.position} ${describeComponent(anchor)}.`,
    };
  },
});

interface LayerArgs {
  targets: string[];
  action: "front" | "back" | "forward" | "backward";
}

const layer = defineCommand<LayerArgs>({
  name: "layer",
  description:
    "Change what's in front of what: send to the front or back, or one step forward or backward. Things further forward cover things behind them.",
  kind: "write",
  schema: {
    required: ["targets", "action"],
    properties: {
      targets: s.targets,
      action: {
        type: "string",
        enum: ["front", "back", "forward", "backward"],
      },
    },
  },
  run: ({ scene, args, world }) => {
    const next = structuredClone(scene);
    const warnings: string[] = [];
    const chosen = placeable(next, args.targets, world, warnings);

    const direction =
      args.action === "front" || args.action === "forward"
        ? "forward"
        : "backward";
    const mode =
      args.action === "front" || args.action === "back" ? "extreme" : "step";
    const changes = computeLayerChanges(
      Object.values(next.components).filter(hasFrame),
      chosen.map((c) => c.id),
      direction,
      mode
    );
    changes.forEach(({ id, zIndex }) => (next.components[id].zIndex = zIndex));

    return {
      scene: next,
      warnings,
      summary: changes.length
        ? `Moved ${chosen.map(describeComponent).join(", ")} ${args.action}.`
        : "Already there; nothing changed.",
    };
  },
});

const selectCommand = defineCommand<{ targets: string[] }>({
  name: "select",
  description:
    "Select components in the editor, replacing the current selection (an empty list clears it). Only works on the scene that's open.",
  // it changes what the author sees, not the scenario, so it's safe everywhere
  kind: "read",
  schema: {
    required: ["targets"],
    properties: { targets: { ...s.targets, minItems: 0 } },
  },
  run: ({ scene, args, world }) => {
    if (scene._id !== world.openSceneId)
      throw new CommandError(
        "Only the scene that's open can have a selection."
      );

    const chosen = args.targets.length
      ? resolveComponents(scene, args.targets, world)
      : [];
    return {
      select: chosen.map((c) => c.id),
      summary: chosen.length
        ? `Selected ${chosen.map(describeComponent).join(", ")}.`
        : "Cleared the selection.",
    };
  },
});

export const arrangeCommands: Command[] = [
  move,
  resize,
  rotate,
  align,
  distribute,
  placeRelative,
  layer,
  selectCommand,
];
