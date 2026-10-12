import { describe, expect, it } from "vitest";
import type { Component } from "../../types";
import {
  canRotate,
  contains,
  getFrame,
  getVisualFrame,
  hasFrame,
  intersectionArea,
  setFrame,
  setRotation,
  unionFrame,
} from "../geometry";
import { box } from "./helpers";

const frame = (c: Component) => getFrame(c as Parameters<typeof getFrame>[0]);

describe("frames", () => {
  it("reads position and size from the corner points", () => {
    expect(frame(box("a", 10, 20, 100, 50))).toEqual({
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    });
  });

  it("copes with corners listed the other way round", () => {
    const flipped = box("a", 0, 0, 0, 0, {
      bounds: {
        verts: [
          { x: 110, y: 70 },
          { x: 10, y: 20 },
        ],
        rotation: 0,
      },
    });
    expect(frame(flipped)).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  it("knows audio has no place on the canvas", () => {
    expect(hasFrame({ id: "s", type: "audio" } as unknown as Component)).toBe(
      false
    );
    expect(hasFrame(box("a", 0, 0, 1, 1))).toBe(true);
  });
});

describe("setFrame", () => {
  it("moves to a position", () => {
    const c = box("a", 10, 20, 100, 50);
    setFrame(c, { x: 300, y: 400 });
    expect(frame(c)).toEqual({ x: 300, y: 400, width: 100, height: 50 });
  });

  it("resizes from the top left", () => {
    const c = box("a", 10, 20, 100, 50);
    setFrame(c, { width: 200, height: 100 });
    expect(frame(c)).toEqual({ x: 10, y: 20, width: 200, height: 100 });
  });

  it("resizes and moves in one go, ending up where it was told", () => {
    const c = box("a", 10, 20, 100, 50);
    setFrame(c, { x: 500, width: 400 });
    expect(frame(c)).toEqual({ x: 500, y: 20, width: 400, height: 50 });
  });

  it("carries a speech bubble's tail along", () => {
    const bubble = {
      ...box("a", 0, 0, 0, 0),
      type: "speech",
      bounds: {
        verts: [
          { x: 0, y: 0 },
          { x: 400, y: 100 },
          { x: 400, y: 120 },
        ],
        rotation: 0,
      },
    } as unknown as Component;
    setFrame(bubble, { x: 100, y: 100 });
    const verts = (bubble as unknown as { bounds: { verts: { y: number }[] } })
      .bounds.verts;
    expect(verts[2].y - verts[1].y).toBe(20);
    expect(frame(bubble)).toMatchObject({ x: 100, y: 100 });
  });

  it("does nothing to audio", () => {
    const audio = { id: "s", type: "audio" } as unknown as Component;
    expect(() => setFrame(audio, { x: 5 })).not.toThrow();
    expect(audio).toEqual({ id: "s", type: "audio" });
  });
});

describe("rotation", () => {
  it("lets everything but lines rotate", () => {
    expect(canRotate(box("a", 0, 0, 10, 10))).toBe(true);
    expect(
      canRotate({ ...box("l", 0, 0, 10, 10), type: "line" } as Component)
    ).toBe(false);
  });

  it("is part of the visual frame", () => {
    const c = box("a", 0, 0, 200, 100);
    setRotation(c, 90);
    const visual = getVisualFrame(c as Parameters<typeof getVisualFrame>[0]);
    // a 200 x 100 box turned a quarter reads 100 wide and 200 tall, same centre
    expect(visual.width).toBeCloseTo(100);
    expect(visual.height).toBeCloseTo(200);
    expect(visual.x + visual.width / 2).toBeCloseTo(100);
    expect(visual.y + visual.height / 2).toBeCloseTo(50);
  });
});

describe("combining frames", () => {
  const a = { x: 0, y: 0, width: 100, height: 100 };
  const b = { x: 50, y: 50, width: 100, height: 100 };

  it("finds the box around several", () => {
    expect(unionFrame([a, b])).toEqual({ x: 0, y: 0, width: 150, height: 150 });
  });

  it("measures overlap", () => {
    expect(intersectionArea(a, b)).toBe(2500);
    expect(intersectionArea(a, { x: 200, y: 200, width: 5, height: 5 })).toBe(
      0
    );
    // touching edges don't overlap
    expect(intersectionArea(a, { x: 100, y: 0, width: 50, height: 50 })).toBe(
      0
    );
  });

  it("knows when one frame holds another, give or take a pixel", () => {
    expect(contains(a, { x: 10, y: 10, width: 20, height: 20 })).toBe(true);
    expect(contains(a, { x: -1, y: 0, width: 50, height: 50 })).toBe(true);
    expect(contains(a, b)).toBe(false);
  });
});
