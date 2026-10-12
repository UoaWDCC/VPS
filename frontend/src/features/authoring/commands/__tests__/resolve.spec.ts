import { describe, expect, it } from "vitest";
import {
  describeComponent,
  resolveComponent,
  resolveComponents,
  resolveScene,
  shortId,
} from "../resolve";
import { CommandError, type World } from "../types";
import { blankScene } from "../memory";
import { box, sceneOf, withText } from "./helpers";

const A = "aaaaaaaa-1111-4111-8111-111111111111";
const B = "bbbbbbbb-2222-4222-8222-222222222222";
const C = "bbbbcccc-3333-4333-8333-333333333333"; // shares "bbbb" with B

const scene = sceneOf(
  withText(box(A, 0, 0, 100, 50), "Continue"),
  withText(box(B, 0, 100, 100, 50), "Give fluids"),
  withText(box(C, 0, 200, 100, 50), "Give oxygen")
);
const world = { selection: [B], openSceneId: scene._id };

describe("resolveComponents", () => {
  it("finds a component by its full id or the start of it", () => {
    expect(resolveComponents(scene, [A], world).map((c) => c.id)).toEqual([A]);
    expect(
      resolveComponents(scene, [shortId(A)], world).map((c) => c.id)
    ).toEqual([A]);
    expect(resolveComponents(scene, ["aaaa"], world).map((c) => c.id)).toEqual([
      A,
    ]);
  });

  it("refuses an id start that fits more than one, and says which", () => {
    expect(() => resolveComponents(scene, ["bbbb"], world)).toThrow(
      /more than one/
    );
    expect(() => resolveComponents(scene, ["bbbb"], world)).toThrow(
      /Give fluids/
    );
  });

  it("finds 'selected' in the open scene", () => {
    expect(
      resolveComponents(scene, ["selected"], world).map((c) => c.id)
    ).toEqual([B]);
    expect(
      resolveComponents(scene, ["Selected"], world).map((c) => c.id)
    ).toEqual([B]);
  });

  it("says so when nothing is selected", () => {
    expect(() =>
      resolveComponents(scene, ["selected"], { ...world, selection: [] })
    ).toThrow(/Nothing is selected/);
  });

  it("ignores the selection in a scene that isn't open", () => {
    const other = { ...world, openSceneId: "somewhere-else" };
    expect(() => resolveComponents(scene, ["selected"], other)).toThrow(
      /Nothing is selected/
    );
  });

  it("finds by the exact text, ignoring case", () => {
    expect(
      resolveComponents(scene, ["continue"], world).map((c) => c.id)
    ).toEqual([A]);
  });

  it("falls back to part of the text, and lets that mean several", () => {
    expect(resolveComponents(scene, ["give"], world).map((c) => c.id)).toEqual([
      B,
      C,
    ]);
  });

  it("returns each component once, in the order asked for", () => {
    const found = resolveComponents(scene, [B, "aaaa", B], world).map(
      (c) => c.id
    );
    expect(found).toEqual([B, A]);
  });

  it("explains how to find the ids when nothing matches", () => {
    expect(() => resolveComponents(scene, ["zzz"], world)).toThrow(
      CommandError
    );
    expect(() => resolveComponents(scene, ["zzz"], world)).toThrow(/get_scene/);
  });
});

describe("resolveComponent", () => {
  it("wants exactly one", () => {
    expect(resolveComponent(scene, "continue", world).id).toBe(A);
    expect(() => resolveComponent(scene, "give", world)).toThrow(
      /matches 2 components/
    );
  });
});

describe("describeComponent", () => {
  it("names a component by short id, type and text", () => {
    expect(describeComponent(scene.components[A])).toBe(
      'aaaaaaaa (box "Continue")'
    );
  });

  it("shortens long text", () => {
    const long = withText(box(A, 0, 0, 1, 1), "x".repeat(60));
    expect(describeComponent(long)).toContain("…");
  });

  it("copes with no text", () => {
    expect(describeComponent(box(A, 0, 0, 1, 1))).toBe("aaaaaaaa (box)");
  });
});

describe("resolveScene", () => {
  const worldOf = (...scenes: ReturnType<typeof blankScene>[]) =>
    ({ scenes, openSceneId: scenes[0]._id }) as unknown as World;
  const one = blankScene({ _id: "507f1f77bcf86cd799439011", name: "Triage" });
  const two = blankScene({
    _id: "507f1f77bcf86cd799439022",
    name: "Ward round",
  });

  it("finds a scene by id, by name, or by the start of an id", () => {
    const w = worldOf(one, two);
    expect(resolveScene(w, one._id)).toBe(one);
    expect(resolveScene(w, "ward ROUND")).toBe(two);
    expect(resolveScene(w, "507f1f77bcf86cd79943902")).toBe(two);
  });

  it("says so when the start of an id fits several scenes (ids made together start alike)", () => {
    const w = worldOf(one, two);
    expect(() => resolveScene(w, "507f1f77bcf86cd79943")).toThrow(
      /more than one scene/
    );
    expect(() => resolveScene(w, "507f1f77bcf86cd79943")).toThrow(
      /Triage, Ward round/
    );
  });

  it("lists the scenes when none matches", () => {
    expect(() => resolveScene(worldOf(one, two), "Discharge")).toThrow(
      /Triage.*Ward round/
    );
  });

  it("won't guess between two scenes with one name", () => {
    const twin = blankScene({
      _id: "507f1f77bcf86cd799439033",
      name: "Triage",
    });
    expect(() => resolveScene(worldOf(one, twin), "triage")).toThrow(
      /More than one scene/
    );
  });
});
