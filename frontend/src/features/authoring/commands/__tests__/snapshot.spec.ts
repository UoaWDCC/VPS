import { describe, expect, it } from "vitest";
import type { Component } from "../../types";
import { blankScene, createMemorySession } from "../memory";
import { displayColor, snapshotScene, snapshotScenario } from "../snapshot";
import { box, sceneOf, withText } from "./helpers";

const NEXT = "507f1f77bcf86cd799439022";

function worldFor(
  open = blankScene(),
  extra: ReturnType<typeof blankScene>[] = [],
  extras = {}
) {
  return createMemorySession({
    scenes: [open, ...extra],
    properties: [
      { id: "hr", name: "heartRate", type: "number", value: 110 },
      { id: "fluids", name: "fluidsGiven", type: "boolean", value: false },
    ],
    ...extras,
  }).world();
}

describe("snapshotScene", () => {
  it("gives every component's place and size, rounded, with its stack position", () => {
    const scene = sceneOf(
      box("aaaaaaaa-1", 10.4, 20.6, 100.2, 50, { zIndex: 5 }),
      box("bbbbbbbb-2", 0, 0, 10, 10, { zIndex: 9 })
    );
    const { components } = snapshotScene(scene, worldFor(scene));

    expect(components).toEqual([
      expect.objectContaining({
        id: "aaaaaaaa",
        type: "box",
        x: 10,
        y: 21,
        width: 100,
        height: 50,
        z: 0,
      }),
      expect.objectContaining({ id: "bbbbbbbb", z: 1 }),
    ]);
  });

  it("lists back to front whatever order they were stored in", () => {
    const scene = sceneOf(
      box("front000-1", 0, 0, 1, 1, { zIndex: 9 }),
      box("back0000-2", 0, 0, 1, 1, { zIndex: 1 })
    );
    const ids = snapshotScene(scene, worldFor(scene)).components.map(
      (c) => c.id
    );
    expect(ids).toEqual(["back0000", "front000"]);
  });

  it("says what a component reads, and how big", () => {
    const scene = sceneOf(
      withText(box("aaaaaaaa-1", 0, 0, 400, 100), "Heart rate: $$heartRate$$", {
        fontSize: 40,
      })
    );
    expect(snapshotScene(scene, worldFor(scene)).components[0]).toMatchObject({
      text: "Heart rate: $$heartRate$$",
      fontSize: 40,
    });
  });

  it("shows colours plainly", () => {
    const scene = sceneOf(
      box("aaaaaaaa-1", 0, 0, 1, 1, { fill: "#0080a7ff", stroke: "#00000000" }),
      box("bbbbbbbb-2", 0, 0, 1, 1, {
        fill: "#00000000",
        stroke: "#ff0000ff",
        strokeWidth: 4,
      })
    );
    const [a, b] = snapshotScene(scene, worldFor(scene)).components;
    expect(a).toMatchObject({ fill: "#0080a7" });
    expect(a.stroke).toBeUndefined();
    expect(b).toMatchObject({
      fill: "transparent",
      stroke: "#ff0000",
      strokeWidth: 4,
    });
  });

  it("says what pressing a button does, in words", () => {
    const next = blankScene({ _id: NEXT, name: "Ward round" });
    const scene = sceneOf(
      withText(
        box("aaaaaaaa-1", 0, 0, 1, 1, {
          nextScene: NEXT,
          stateOperations: [
            { stateVariableId: "fluids", operation: "set", value: true },
            { stateVariableId: "hr", operation: "subtract", value: 15 },
          ],
        }),
        "Give fluids"
      )
    );
    expect(
      snapshotScene(scene, worldFor(scene, [next])).components[0]
    ).toMatchObject({
      clickable: true,
      goesTo: "Ward round",
      changes: ["fluidsGiven = true", "heartRate − 15"],
    });
  });

  it("doesn't call a plain shape clickable just because it can be", () => {
    const scene = sceneOf(box("aaaaaaaa-1", 0, 0, 1, 1, { clickable: true }));
    expect(
      snapshotScene(scene, worldFor(scene)).components[0].clickable
    ).toBeUndefined();
  });

  it("names what drives a component, and flags a deleted property", () => {
    const scene = sceneOf(
      box("aaaaaaaa-1", 0, 0, 1, 1, {
        stateBindings: [
          { target: "width", stateVariableId: "hr" },
          { target: "x", stateVariableId: "gone" },
        ],
      })
    );
    expect(
      snapshotScene(scene, worldFor(scene)).components[0].bindings
    ).toEqual(["width follows heartRate", "x follows a deleted property"]);
  });

  it("marks what's selected, but only in the open scene", () => {
    const scene = sceneOf(
      box("aaaaaaaa-1", 0, 0, 1, 1),
      box("bbbbbbbb-2", 0, 0, 1, 1)
    );
    const world = worldFor(scene, [], { selection: ["bbbbbbbb-2"] });
    const [a, b] = snapshotScene(scene, world).components;
    expect(a.selected).toBeUndefined();
    expect(b.selected).toBe(true);

    const elsewhere = { ...scene, _id: "another" };
    expect(
      snapshotScene(elsewhere, world).components.some((c) => c.selected)
    ).toBe(false);
  });

  it("lists sounds apart from the canvas", () => {
    const sound = {
      id: "ssssssss-1",
      type: "audio",
      name: "Heart monitor",
      url: "u",
      loop: true,
    } as unknown as Component;
    const scene = sceneOf(box("aaaaaaaa-1", 0, 0, 1, 1), sound);
    const snapshot = snapshotScene(scene, worldFor(scene));
    expect(snapshot.components).toHaveLength(1);
    expect(snapshot.audio).toEqual([
      { id: "ssssssss", name: "Heart monitor", loop: true },
    ]);
  });

  it("reports the scene's own settings", () => {
    const next = blankScene({ _id: NEXT, name: "Ward round" });
    const scene = {
      ...blankScene({ name: "Triage", time: 60, directLink: NEXT }),
    };
    expect(snapshotScene(scene, worldFor(scene, [next]))).toMatchObject({
      name: "Triage",
      canvas: { width: 1920, height: 1080 },
      time: 60,
      directLink: "Ward round",
      background: null,
    });
  });

  it("brings the layout problems with it", () => {
    const scene = sceneOf(box("aaaaaaaa-1", 1800, 0, 300, 100));
    expect(snapshotScene(scene, worldFor(scene)).issues[0]).toMatch(
      /past the right edge/
    );
  });
});

describe("displayColor", () => {
  it("drops full opacity, names clear, and keeps the rest", () => {
    expect(displayColor("#0080a7ff")).toBe("#0080a7");
    expect(displayColor("#12345600")).toBe("transparent");
    expect(displayColor("#12345680")).toBe("#12345680");
    expect(displayColor(undefined)).toBeUndefined();
  });
});

describe("snapshotScenario", () => {
  it("shows the scenes, how their buttons connect, and the properties", () => {
    const ward = blankScene({ _id: NEXT, name: "Ward round" });
    const triage = sceneOf(
      withText(
        box("aaaaaaaa-1", 0, 0, 1, 1, { nextScene: NEXT }),
        "Give fluids"
      ),
      box("bbbbbbbb-2", 0, 0, 1, 1, { nextScene: NEXT })
    );
    triage.name = "Triage";

    const overview = snapshotScenario(worldFor(triage, [ward]));
    expect(overview.openScene).toBe(triage._id);
    expect(overview.scenes[0]).toMatchObject({
      name: "Triage",
      components: 2,
      links: [
        { from: "Give fluids", to: "Ward round" },
        { from: "bbbbbbbb", to: "Ward round" },
      ],
    });
    expect(overview.scenes[1]).toMatchObject({
      name: "Ward round",
      components: 0,
      links: [],
    });
    expect(overview.properties.map((p) => p.name)).toEqual([
      "heartRate",
      "fluidsGiven",
    ]);
  });
});
