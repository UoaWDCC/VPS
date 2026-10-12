import { expect } from "vitest";
import type { Component, Scene } from "../../types";
import { blankScene, createMemorySession, type MemorySession } from "../memory";
import { runCommand } from "../run";
import type { RunResult, ScenarioProperty } from "../types";

// Small helpers so the specs read as what they check, not as set-up.

type Loose = Record<string, unknown>;

export function box(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  extra: Loose = {}
): Component {
  return {
    id,
    type: "box",
    clickable: true,
    fill: "#b7b7b7ff",
    stroke: "#00000000",
    strokeWidth: 3,
    zIndex: 0,
    bounds: {
      verts: [
        { x, y },
        { x: x + width, y: y + height },
      ],
      rotation: 0,
    },
    ...extra,
  } as unknown as Component;
}

export function withText(
  component: Component,
  text: string,
  style: Loose = {}
) {
  return {
    ...component,
    document: {
      type: "text",
      style,
      blocks: [{ style: {}, spans: [{ style: {}, text }] }],
    },
  } as unknown as Component;
}

export function sceneOf(...components: Component[]): Scene {
  return blankScene({
    components: Object.fromEntries(components.map((c) => [c.id, c])),
  });
}

export function sessionFor(
  scene: Scene,
  options: {
    others?: Scene[];
    properties?: ScenarioProperty[];
    selection?: string[];
  } = {}
): MemorySession {
  return createMemorySession({
    scenes: [scene, ...(options.others ?? [])],
    properties: options.properties,
    selection: options.selection,
  });
}

/** Runs a command and insists it worked. */
export async function ok(
  session: MemorySession,
  name: string,
  args: Loose = {}
): Promise<RunResult> {
  const result = await runCommand(session, name, args);
  expect(result.error, `${name} failed`).toBeUndefined();
  expect(result.ok).toBe(true);
  return result;
}

/** Runs a command and insists it was refused, returning why. */
export async function refused(
  session: MemorySession,
  name: string,
  args: Loose = {}
): Promise<string> {
  const result = await runCommand(session, name, args);
  expect(result.ok, `${name} should have failed`).toBe(false);
  return result.error ?? "";
}

/** The id of the one thing a command created. */
export function createdId(result: RunResult) {
  const created = (result.output as { created: { id: string }[] }).created;
  expect(created).toHaveLength(1);
  return created[0].id;
}

/** A component by (the start of) its id. */
export function find(session: MemorySession, id: string, sceneId?: string) {
  const scene = session.scene(sceneId);
  const found = Object.values(scene.components).filter((c) =>
    c.id.startsWith(id)
  );
  expect(found, `component ${id}`).toHaveLength(1);
  return found[0] as Component & Loose;
}

export function frameOf(component: Component) {
  const [a, b] = (
    component as unknown as { bounds: { verts: { x: number; y: number }[] } }
  ).bounds.verts;
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}
