import { describe, expect, it } from "vitest";
import { blankScene } from "../memory";
import { box, ok, sceneOf, sessionFor, withText } from "./helpers";

const A = "aaaaaaaa-1111-4111-8111-111111111111";
const B = "bbbbbbbb-2222-4222-8222-222222222222";

const triage = () =>
  sceneOf(
    withText(
      box(A, 100, 100, 400, 120, { nextScene: "next-scene" }),
      "Give fluids"
    ),
    withText(box(B, 100, 400, 400, 120), "Notes")
  );
const next = blankScene({ _id: "next-scene", name: "Ward round" });

describe("read commands", () => {
  it("never change the scene, however they're asked", async () => {
    const session = sessionFor(triage(), { others: [next], selection: [A] });
    const before = JSON.stringify(session.scene());

    for (const name of [
      "get_scene",
      "get_scenario",
      "get_selection",
      "find_components",
      "list_library",
      "run_checks",
    ])
      await ok(session, name, {});

    expect(JSON.stringify(session.scene())).toBe(before);
    expect(session.writes).toHaveLength(0);
  });

  describe("get_scene", () => {
    it("returns the snapshot the model works from", async () => {
      const session = sessionFor(triage(), { others: [next] });
      const result = await ok(session, "get_scene");
      expect(result.output).toMatchObject({
        name: "Scene 1",
        canvas: { width: 1920, height: 1080 },
        components: [
          { id: "aaaaaaaa", text: "Give fluids", goesTo: "Ward round" },
          { id: "bbbbbbbb", text: "Notes" },
        ],
      });
      expect(result.summary).toContain("2 components");
    });

    it("can look at another scene by name", async () => {
      const session = sessionFor(triage(), { others: [next] });
      const result = await ok(session, "get_scene", { sceneId: "ward round" });
      expect(result.output).toMatchObject({
        name: "Ward round",
        components: [],
      });
    });
  });

  it("get_scenario shows the scenes and how they connect", async () => {
    const session = sessionFor(triage(), {
      others: [next],
      properties: [{ id: "hr", name: "heartRate", type: "number", value: 110 }],
    });
    const { output } = await ok(session, "get_scenario");
    expect(output).toMatchObject({
      scenes: [
        { name: "Scene 1", links: [{ from: "Give fluids", to: "Ward round" }] },
        { name: "Ward round" },
      ],
      properties: [{ name: "heartRate", value: 110 }],
    });
  });

  describe("get_selection", () => {
    it("returns what's selected", async () => {
      const session = sessionFor(triage(), { selection: [B] });
      const { output, summary } = await ok(session, "get_selection");
      expect(output).toMatchObject([{ id: "bbbbbbbb", text: "Notes" }]);
      expect(summary).toBe("1 selected.");
    });

    it("says when nothing is", async () => {
      const { summary, output } = await ok(
        sessionFor(triage()),
        "get_selection"
      );
      expect(output).toEqual([]);
      expect(summary).toBe("Nothing is selected.");
    });
  });

  describe("find_components", () => {
    it("searches by text, ignoring case", async () => {
      const { output } = await ok(sessionFor(triage()), "find_components", {
        text: "FLUIDS",
      });
      expect(output).toMatchObject([{ id: "aaaaaaaa" }]);
    });

    it("filters by type and by whether pressing does anything", async () => {
      const session = sessionFor(triage(), { others: [next] });
      const buttons = await ok(session, "find_components", { clickable: true });
      expect(buttons.output).toMatchObject([{ id: "aaaaaaaa" }]);
      const plain = await ok(session, "find_components", { clickable: false });
      expect(plain.output).toMatchObject([{ id: "bbbbbbbb" }]);
      const lines = await ok(session, "find_components", { type: "line" });
      expect(lines.output).toEqual([]);
    });
  });

  describe("list_library", () => {
    it("searches names and tags of the built-in items", async () => {
      const { output } = await ok(sessionFor(triage()), "list_library", {
        query: "fever",
      });
      expect(output).toMatchObject([{ id: "thermometer", kind: "image" }]);
    });

    it("narrows by kind", async () => {
      const { output } = await ok(sessionFor(triage()), "list_library", {
        kind: "audio",
      });
      expect((output as { id: string }[]).map((i) => i.id)).toEqual([
        "heart-monitor",
        "alert",
        "chime",
      ]);
    });

    it("gives the ids add_library_item accepts", async () => {
      const { output } = await ok(sessionFor(triage()), "list_library", {});
      expect((output as { id: string }[]).length).toBeGreaterThan(15);
    });
  });

  describe("run_checks", () => {
    it("is happy with a sound scene", async () => {
      const session = sessionFor(triage(), { others: [next] });
      const result = await ok(session, "run_checks");
      expect(result.summary).toBe("No problems found.");
    });

    it("finds a button that leads nowhere, and a button changing a deleted property", async () => {
      const scene = sceneOf(
        withText(
          box(A, 100, 100, 400, 120, { nextScene: "deleted-scene" }),
          "Go"
        ),
        withText(
          box(B, 100, 400, 400, 120, {
            stateOperations: [
              {
                stateVariableId: "gone",
                displayName: "oldProperty",
                operation: "set",
                value: 1,
              },
            ],
          }),
          "Escalate"
        )
      );
      const { output } = await ok(sessionFor(scene), "run_checks");
      const { problems } = output as {
        problems: { level: string; message: string }[];
      };
      expect(problems.some((p) => /no longer exists/.test(p.message))).toBe(
        true
      );
      expect(
        problems.filter((p) => p.level === "error").length
      ).toBeGreaterThanOrEqual(2);
    });

    it("includes layout problems", async () => {
      const scene = sceneOf(box(A, 1800, 0, 300, 100));
      const { output } = await ok(sessionFor(scene), "run_checks");
      expect((output as { layout: string[] }).layout[0]).toMatch(
        /past the right edge/
      );
    });
  });
});
