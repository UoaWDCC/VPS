import { describe, expect, it } from "vitest";
import type { Component } from "../../types";
import {
  box,
  find,
  frameOf,
  ok,
  refused,
  sceneOf,
  sessionFor,
  withText,
} from "./helpers";

const A = "aaaaaaaa-1111-4111-8111-111111111111";
const B = "bbbbbbbb-2222-4222-8222-222222222222";
const C = "cccccccc-3333-4333-8333-333333333333";

const frameIn = (session: ReturnType<typeof sessionFor>, id: string) =>
  frameOf(find(session, id));

describe("move", () => {
  it("moves by an amount", async () => {
    const session = sessionFor(sceneOf(box(A, 100, 100, 200, 100)));
    await ok(session, "move", { targets: [A], dx: 50, dy: -20 });
    expect(frameIn(session, A)).toEqual({
      x: 150,
      y: 80,
      width: 200,
      height: 100,
    });
  });

  it("moves to a position", async () => {
    const session = sessionFor(sceneOf(box(A, 100, 100, 200, 100)));
    await ok(session, "move", { targets: [A], x: 500, y: 40 });
    expect(frameIn(session, A)).toMatchObject({ x: 500, y: 40 });
  });

  it("moves only the axis it's told to", async () => {
    const session = sessionFor(sceneOf(box(A, 100, 100, 200, 100)));
    await ok(session, "move", { targets: [A], x: 0 });
    expect(frameIn(session, A)).toMatchObject({ x: 0, y: 100 });
  });

  it("moves a group to a position as one, keeping the spacing", async () => {
    const session = sessionFor(
      sceneOf(box(A, 0, 0, 100, 100), box(B, 200, 0, 100, 100))
    );
    await ok(session, "move", { targets: [A, B], x: 100 });
    expect(frameIn(session, A).x).toBe(100);
    expect(frameIn(session, B).x).toBe(300);
  });

  it("wants one style or the other", async () => {
    const session = sessionFor(sceneOf(box(A, 0, 0, 10, 10)));
    expect(await refused(session, "move", { targets: [A] })).toMatch(
      /dx\/dy or x\/y/
    );
    expect(
      await refused(session, "move", { targets: [A], dx: 1, x: 1 })
    ).toMatch(/dx\/dy or x\/y/);
  });

  it("leaves a sound alone and says so", async () => {
    const sound = {
      id: "sound-1",
      type: "audio",
      name: "x",
      url: "u",
      loop: false,
    } as unknown as Component;
    const session = sessionFor(sceneOf(box(A, 0, 0, 10, 10), sound));
    const result = await ok(session, "move", {
      targets: [A, "sound-1"],
      dx: 5,
    });
    expect(result.warnings?.join(" ")).toMatch(/no place on the canvas/);
  });
});

describe("resize", () => {
  it("sets a size, keeping the top left", async () => {
    const session = sessionFor(sceneOf(box(A, 10, 20, 100, 50)));
    await ok(session, "resize", { targets: [A], width: 300, height: 150 });
    expect(frameIn(session, A)).toEqual({
      x: 10,
      y: 20,
      width: 300,
      height: 150,
    });
  });

  it("changes just one dimension", async () => {
    const session = sessionFor(sceneOf(box(A, 10, 20, 100, 50)));
    await ok(session, "resize", { targets: [A], width: 300 });
    expect(frameIn(session, A)).toMatchObject({ width: 300, height: 50 });
  });

  it("scales", async () => {
    const session = sessionFor(sceneOf(box(A, 10, 20, 100, 50)));
    await ok(session, "resize", { targets: [A], scale: 2 });
    expect(frameIn(session, A)).toEqual({
      x: 10,
      y: 20,
      width: 200,
      height: 100,
    });
  });

  it("keeps the proportions when asked", async () => {
    const session = sessionFor(sceneOf(box(A, 0, 0, 100, 50)));
    await ok(session, "resize", {
      targets: [A],
      width: 400,
      keepAspectRatio: true,
    });
    expect(frameIn(session, A)).toMatchObject({ width: 400, height: 200 });
  });

  it("needs a size to go to", async () => {
    const session = sessionFor(sceneOf(box(A, 0, 0, 10, 10)));
    expect(await refused(session, "resize", { targets: [A] })).toMatch(
      /width, a height or a scale/
    );
  });
});

describe("rotate", () => {
  it("sets an angle, and turns relative to where it is", async () => {
    const session = sessionFor(sceneOf(box(A, 0, 0, 100, 50)));
    await ok(session, "rotate", { targets: [A], degrees: 30 });
    expect(
      (find(session, A) as unknown as { bounds: { rotation: number } }).bounds
        .rotation
    ).toBe(30);

    await ok(session, "rotate", { targets: [A], degrees: 20, relative: true });
    expect(
      (find(session, A) as unknown as { bounds: { rotation: number } }).bounds
        .rotation
    ).toBe(50);
  });

  it("keeps angles between 0 and 360", async () => {
    const session = sessionFor(sceneOf(box(A, 0, 0, 100, 50)));
    await ok(session, "rotate", { targets: [A], degrees: -90 });
    expect(
      (find(session, A) as unknown as { bounds: { rotation: number } }).bounds
        .rotation
    ).toBe(270);
  });

  it("won't rotate a line", async () => {
    const line = { ...box(A, 0, 0, 100, 0), type: "line" } as Component;
    const session = sessionFor(sceneOf(line, box(B, 0, 100, 100, 50)));

    const result = await ok(session, "rotate", {
      targets: [A, B],
      degrees: 45,
    });
    expect(result.warnings?.join(" ")).toMatch(/can't be rotated/);
    expect(
      (find(session, B) as unknown as { bounds: { rotation: number } }).bounds
        .rotation
    ).toBe(45);

    expect(
      await refused(session, "rotate", { targets: [A], degrees: 45 })
    ).toMatch(/can't be rotated/);
  });
});

describe("align", () => {
  const trio = () =>
    sessionFor(sceneOf(box(A, 0, 0, 100, 50), box(B, 300, 200, 200, 100)));

  it("lines components up with each other", async () => {
    for (const [alignment, a, b] of [
      ["left", { x: 0 }, { x: 0 }],
      ["right", { x: 400 }, { x: 300 }],
      ["center", { x: 200 }, { x: 150 }],
      ["top", { y: 0 }, { y: 0 }],
      ["bottom", { y: 250 }, { y: 200 }],
      ["middle", { y: 125 }, { y: 100 }],
    ] as const) {
      const session = trio();
      await ok(session, "align", { targets: [A, B], alignment });
      expect(frameIn(session, A), alignment).toMatchObject(a);
      expect(frameIn(session, B), alignment).toMatchObject(b);
    }
  });

  it("lines a single component up with the canvas", async () => {
    const session = sessionFor(sceneOf(box(A, 0, 0, 100, 100)));
    await ok(session, "align", { targets: [A], alignment: "center" });
    await ok(session, "align", { targets: [A], alignment: "middle" });
    expect(frameIn(session, A)).toMatchObject({ x: 910, y: 490 });
  });

  it("can line several up with the canvas", async () => {
    const session = trio();
    await ok(session, "align", {
      targets: [A, B],
      alignment: "left",
      relativeTo: "canvas",
    });
    expect(frameIn(session, A).x).toBe(0);
    await ok(session, "align", {
      targets: [A, B],
      alignment: "right",
      relativeTo: "canvas",
    });
    expect(frameIn(session, A).x + 100).toBe(1920);
    expect(frameIn(session, B).x + 200).toBe(1920);
  });
});

describe("distribute", () => {
  const row = () =>
    sessionFor(
      sceneOf(
        box(B, 400, 0, 100, 100),
        box(A, 0, 0, 100, 100),
        box(C, 800, 0, 100, 100)
      )
    );

  it("spreads evenly between the first and last, whatever order they were given in", async () => {
    const session = row();
    await ok(session, "distribute", {
      targets: [B, C, A],
      direction: "horizontal",
    });
    expect([A, B, C].map((id) => frameIn(session, id).x)).toEqual([
      0, 400, 800,
    ]);
  });

  it("packs with an exact gap", async () => {
    const session = row();
    await ok(session, "distribute", {
      targets: [A, B, C],
      direction: "horizontal",
      gap: 50,
    });
    expect([A, B, C].map((id) => frameIn(session, id).x)).toEqual([
      0, 150, 300,
    ]);
  });

  it("works vertically", async () => {
    const session = sessionFor(
      sceneOf(
        box(A, 0, 0, 100, 100),
        box(B, 0, 130, 100, 100),
        box(C, 0, 1000, 100, 80)
      )
    );
    await ok(session, "distribute", {
      targets: [A, B, C],
      direction: "vertical",
    });
    // 1080 tall in all, 280 of it components: two gaps of 400
    expect([A, B, C].map((id) => frameIn(session, id).y)).toEqual([
      0, 500, 1000,
    ]);
  });

  it("needs enough to work with", async () => {
    const session = row();
    expect(
      await refused(session, "distribute", {
        targets: [A],
        direction: "horizontal",
        gap: 5,
      })
    ).toMatch(/at least 2/);
    expect(
      await refused(session, "distribute", {
        targets: [A, B],
        direction: "horizontal",
      })
    ).toMatch(/3 or more/);
  });
});

describe("place_relative", () => {
  const pair = () =>
    sessionFor(
      sceneOf(
        box(A, 100, 100, 200, 100),
        withText(box(B, 0, 0, 50, 50), "Target")
      )
    );

  it("goes below, centred, with the default gap", async () => {
    const session = pair();
    await ok(session, "place_relative", {
      target: "Target",
      anchor: A,
      position: "below",
    });
    expect(frameIn(session, B)).toMatchObject({ x: 175, y: 224 });
  });

  it("goes above, left and right", async () => {
    const session = pair();
    await ok(session, "place_relative", {
      target: B,
      anchor: A,
      position: "above",
    });
    expect(frameIn(session, B).y).toBe(26);
    await ok(session, "place_relative", {
      target: B,
      anchor: A,
      position: "right-of",
    });
    expect(frameIn(session, B)).toMatchObject({ x: 324, y: 125 });
    await ok(session, "place_relative", {
      target: B,
      anchor: A,
      position: "left-of",
    });
    expect(frameIn(session, B).x).toBe(26);
  });

  it("takes a gap and an alignment", async () => {
    const session = pair();
    await ok(session, "place_relative", {
      target: B,
      anchor: A,
      position: "below",
      gap: 10,
      align: "start",
    });
    expect(frameIn(session, B)).toMatchObject({ x: 100, y: 210 });
    await ok(session, "place_relative", {
      target: B,
      anchor: A,
      position: "below",
      gap: 10,
      align: "end",
    });
    expect(frameIn(session, B).x).toBe(250);
  });

  it("won't put something next to itself", async () => {
    expect(
      await refused(pair(), "place_relative", {
        target: A,
        anchor: A,
        position: "below",
      })
    ).toMatch(/next to itself/);
  });
});

describe("layer", () => {
  const stack = () =>
    sessionFor(
      sceneOf(
        box(A, 0, 0, 10, 10, { zIndex: 0 }),
        box(B, 0, 0, 10, 10, { zIndex: 1 }),
        box(C, 0, 0, 10, 10, { zIndex: 2 })
      )
    );
  const order = (session: ReturnType<typeof stack>) =>
    [A, B, C].sort((x, y) => find(session, x).zIndex - find(session, y).zIndex);

  it("brings to the front and sends to the back", async () => {
    const session = stack();
    await ok(session, "layer", { targets: [A], action: "front" });
    expect(order(session)).toEqual([B, C, A]);
    await ok(session, "layer", { targets: [A], action: "back" });
    expect(order(session)).toEqual([A, B, C]);
  });

  it("steps one at a time", async () => {
    const session = stack();
    await ok(session, "layer", { targets: [A], action: "forward" });
    expect(order(session)).toEqual([B, A, C]);
    await ok(session, "layer", { targets: [A], action: "backward" });
    expect(order(session)).toEqual([A, B, C]);
  });

  it("says when there's nowhere to go and writes nothing", async () => {
    const session = stack();
    const result = await ok(session, "layer", {
      targets: [C],
      action: "front",
    });
    expect(result.summary).toMatch(/nothing changed/);
    expect(session.writes).toHaveLength(0);
  });
});

describe("select", () => {
  it("replaces the selection", async () => {
    const session = sessionFor(
      sceneOf(box(A, 0, 0, 10, 10), box(B, 0, 0, 10, 10)),
      { selection: [A] }
    );
    await ok(session, "select", { targets: [B] });
    expect(session.selection()).toEqual([B]);
  });

  it("clears it with an empty list", async () => {
    const session = sessionFor(sceneOf(box(A, 0, 0, 10, 10)), {
      selection: [A],
    });
    await ok(session, "select", { targets: [] });
    expect(session.selection()).toEqual([]);
  });

  it("changes no scene, so it's safe even where editing isn't", async () => {
    const session = sessionFor(sceneOf(box(A, 0, 0, 10, 10)));
    await ok(session, "select", { targets: [A] });
    expect(session.writes).toHaveLength(0);
  });
});
