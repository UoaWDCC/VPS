import {
  describeCondition,
  describeOperation,
} from "../../playScenario/debug/describe.js";
import type { Component, Scene } from "../types";
import { getFrame, getRotation, hasFrame, round } from "./geometry";
import { shortId } from "./resolve";
import { componentText, fontSizeOf, getDocument } from "./text";
import type { World } from "./types";
import { spatialIssues } from "./warnings";

// What the model sees. Numbers, not pictures: where every component is on the
// 1920 x 1080 canvas, how big, what it says, what it does when pressed, and
// what's wrong with the layout. Small enough to send with every message.

export interface ComponentSnapshot {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  /** Position in the stack, 0 at the back. */
  z: number;
  text?: string;
  fontSize?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  clickable?: boolean;
  /**
   * Name of the scene a press leads to. For a button with rules, the scene
   * for when none of them match.
   */
  goesTo?: string;
  /**
   * Where a press leads depending on properties, checked in this order, after
   * the button's own changes: "if heartRate > 120 → Deteriorates".
   */
  rules?: string[];
  /** What a press does to properties. */
  changes?: string[];
  /** Properties that drive this component's look or position. */
  bindings?: string[];
  selected?: boolean;
}

export interface SceneSnapshot {
  id: string;
  name: string;
  canvas: { width: number; height: number };
  time: number | null;
  directLink: string | null;
  background: string | null;
  components: ComponentSnapshot[];
  audio: { id: string; name: string; loop: boolean }[];
  /** Layout problems: overlaps, off-canvas, text that won't fit. */
  issues: string[];
}

/** #0080a7ff reads as #0080a7; fully clear reads as transparent. */
export function displayColor(color: unknown) {
  if (typeof color !== "string") return undefined;
  if (/^#[0-9a-f]{8}$/i.test(color)) {
    if (color.endsWith("00")) return "transparent";
    if (color.toLowerCase().endsWith("ff")) return color.slice(0, 7);
  }
  return color;
}

function field(component: Component, key: string) {
  return (component as unknown as Record<string, unknown>)[key];
}

function sceneName(world: Pick<World, "scenes">, id: unknown) {
  if (typeof id !== "string" || !id) return undefined;
  return world.scenes.find((s) => s._id === id)?.name ?? `unknown scene ${id}`;
}

/** A button's destination rules in words, in the order they're checked. */
function destinationRules(component: Component, world: World) {
  const rules = field(component, "nextSceneRules");
  if (!Array.isArray(rules)) return [];
  return rules.map(
    (rule: {
      sceneId: string;
      stateVariableId: string;
      comparator: string;
    }) => ({
      condition: describeCondition(rule, world.properties),
      to: sceneName(world, rule.sceneId) ?? "no scene",
    })
  );
}

function snapshotComponent(
  component: Component & { bounds: { verts: { x: number; y: number }[] } },
  z: number,
  world: World,
  selection: string[]
): ComponentSnapshot {
  const frame = getFrame(component);
  const snapshot: ComponentSnapshot = {
    id: shortId(component.id),
    type: component.type,
    x: round(frame.x),
    y: round(frame.y),
    width: round(frame.width),
    height: round(frame.height),
    z,
  };

  const rotation = getRotation(component);
  if (rotation) snapshot.rotation = round(rotation);

  const text = componentText(component);
  if (text) {
    snapshot.text = text;
    snapshot.fontSize = fontSizeOf(component);
  }
  if (getDocument(component) === null && component.type === "textbox")
    snapshot.text = "";

  const fill = displayColor(field(component, "fill"));
  const stroke = displayColor(field(component, "stroke"));
  const strokeWidth = field(component, "strokeWidth");
  if (fill) snapshot.fill = fill;
  if (stroke && stroke !== "transparent") snapshot.stroke = stroke;
  if (typeof strokeWidth === "number" && stroke && stroke !== "transparent")
    snapshot.strokeWidth = strokeWidth;

  const goesTo = sceneName(world, field(component, "nextScene"));
  const rules = destinationRules(component, world);
  const operations = field(component, "stateOperations");
  const bindings = field(component, "stateBindings");
  const acts =
    Boolean(goesTo) ||
    rules.length > 0 ||
    (Array.isArray(operations) && operations.length > 0);
  if (field(component, "clickable") && acts) snapshot.clickable = true;
  if (goesTo) snapshot.goesTo = goesTo;
  if (rules.length)
    snapshot.rules = rules.map(
      ({ condition, to }) => `if ${condition} → ${to}`
    );
  if (Array.isArray(operations) && operations.length)
    snapshot.changes = operations.map((op) =>
      describeOperation(op, world.properties)
    );
  if (Array.isArray(bindings) && bindings.length)
    snapshot.bindings = bindings.map(
      (binding: { target: string; stateVariableId: string }) => {
        const name =
          world.properties.find((p) => p.id === binding.stateVariableId)
            ?.name ?? "a deleted property";
        return `${binding.target} follows ${name}`;
      }
    );

  if (selection.includes(component.id)) snapshot.selected = true;
  return snapshot;
}

export function snapshotScene(scene: Scene, world: World): SceneSnapshot {
  const selection = scene._id === world.openSceneId ? world.selection : [];
  const components = Object.values(scene.components);

  const placed = components
    .filter(hasFrame)
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
    .map((component, z) => snapshotComponent(component, z, world, selection));

  const audio = components
    .filter((c) => c.type === "audio")
    .map((c) => ({
      id: shortId(c.id),
      name:
        typeof field(c, "name") === "string"
          ? (field(c, "name") as string)
          : "",
      loop: Boolean(field(c, "loop")),
    }));

  const background = scene.background;
  return {
    id: scene._id,
    name: scene.name,
    canvas: world.canvas,
    time: scene.time ?? null,
    directLink: sceneName(world, scene.directLink) ?? null,
    background: !background
      ? null
      : background.kind === "color"
        ? `color ${displayColor(background.color)}`
        : "image",
    components: placed,
    audio,
    issues: spatialIssues(scene, world.canvas),
  };
}

export interface ScenarioSnapshot {
  canvas: { width: number; height: number };
  openScene: string;
  scenes: {
    id: string;
    name: string;
    components: number;
    time: number | null;
    /**
     * Where the buttons in this scene lead. `when` says what a button with
     * rules needs for that link: a condition, or "otherwise".
     */
    links: { from: string; to: string; when?: string }[];
    directLink: string | null;
  }[];
  properties: { id: string; name: string; type: string; value: unknown }[];
}

/** The whole scenario in brief: scenes, how they connect, and properties. */
export function snapshotScenario(world: World): ScenarioSnapshot {
  return {
    canvas: world.canvas,
    openScene: world.openSceneId,
    scenes: world.scenes.map((scene) => {
      const components = Object.values(scene.components);
      const links = components.flatMap((component) => {
        const text = componentText(component).trim();
        const from = text || shortId(component.id);
        const rules = destinationRules(component, world);
        const to = sceneName(world, field(component, "nextScene"));
        return [
          ...rules.map((rule) => ({
            from,
            to: rule.to,
            when: rule.condition,
          })),
          ...(to
            ? [{ from, to, ...(rules.length && { when: "otherwise" }) }]
            : []),
        ];
      });
      return {
        id: scene._id,
        name: scene.name,
        components: components.length,
        time: scene.time ?? null,
        links,
        directLink: sceneName(world, scene.directLink) ?? null,
      };
    }),
    properties: world.properties.map(({ id, name, type, value }) => ({
      id,
      name,
      type,
      value,
    })),
  };
}
