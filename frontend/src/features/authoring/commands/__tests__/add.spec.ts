import { describe, expect, it } from "vitest";
import { PALETTE } from "../../library/palette.js";
import { blankScene } from "../memory";
import {
  box,
  createdId,
  find,
  frameOf,
  ok,
  refused,
  sceneOf,
  sessionFor,
} from "./helpers";

const empty = () => sessionFor(blankScene());

describe("add_shape", () => {
  it("draws a box, centred, at the default size", async () => {
    const session = empty();
    const result = await ok(session, "add_shape", { shape: "box" });
    const added = find(session, createdId(result));

    expect(added.type).toBe("box");
    expect(frameOf(added)).toEqual({ x: 810, y: 440, width: 300, height: 200 });
    expect(result.changed).toMatchObject({
      added: [createdId(result)],
      modified: [],
      removed: [],
    });
  });

  it("goes where it's told, at the size it's told", async () => {
    const session = empty();
    const result = await ok(session, "add_shape", {
      shape: "ellipse",
      x: 50,
      y: 60,
      width: 120,
      height: 80,
    });
    expect(frameOf(find(session, createdId(result)))).toEqual({
      x: 50,
      y: 60,
      width: 120,
      height: 80,
    });
  });

  it("applies colours, understanding names and the theme's own", async () => {
    const session = empty();
    const result = await ok(session, "add_shape", {
      shape: "box",
      fill: "accent",
      stroke: "red",
      strokeWidth: 6,
    });
    expect(find(session, createdId(result))).toMatchObject({
      fill: `${PALETTE.accent}ff`,
      stroke: "#e53935ff",
      strokeWidth: 6,
    });
  });

  it("puts new things on top of what's there", async () => {
    const session = sessionFor(
      sceneOf(box("existing-1", 0, 0, 10, 10, { zIndex: 7 }))
    );
    const result = await ok(session, "add_shape", { shape: "box" });
    expect(find(session, createdId(result)).zIndex).toBe(8);
  });

  it("selects what it made, so the next command can say 'selected'", async () => {
    const session = empty();
    const result = await ok(session, "add_shape", { shape: "box" });
    expect(session.selection()).toEqual([find(session, createdId(result)).id]);
  });

  it("gives text a colour it can be read in", async () => {
    const session = empty();
    const dark = await ok(session, "add_shape", {
      shape: "box",
      fill: "#101010",
      text: "Dark",
    });
    const light = await ok(session, "add_shape", {
      shape: "box",
      fill: "#f0f0f0",
      text: "Light",
    });

    const colorOf = (id: string) =>
      (find(session, id).document as { style: { textColor: string } }).style
        .textColor;
    expect(colorOf(createdId(dark))).toBe(PALETTE.onSolid);
    expect(colorOf(createdId(light))).toBe(PALETTE.content);
  });

  it("makes a speech bubble with a tail", async () => {
    const session = empty();
    const result = await ok(session, "add_shape", {
      shape: "speech",
      x: 0,
      y: 0,
      width: 400,
      height: 100,
    });
    const verts = (
      find(session, createdId(result)) as unknown as {
        bounds: { verts: { y: number }[] };
      }
    ).bounds.verts;
    expect(verts).toHaveLength(3);
    expect(verts[2].y).toBe(verts[1].y + 20);
  });

  it("makes a line, horizontal when it has no height", async () => {
    const session = empty();
    const result = await ok(session, "add_shape", {
      shape: "line",
      x: 100,
      y: 100,
      width: 400,
      stroke: "black",
    });
    expect(frameOf(find(session, createdId(result)))).toEqual({
      x: 100,
      y: 100,
      width: 400,
      height: 0,
    });
  });

  it("won't fill a line or put text on one", async () => {
    const session = empty();
    expect(
      await refused(session, "add_shape", { shape: "line", fill: "red" })
    ).toMatch(/no fill/);
    expect(
      await refused(session, "add_shape", { shape: "line", text: "hi" })
    ).toMatch(/can't hold text/);
    expect(Object.keys(session.scene().components)).toHaveLength(0);
  });

  it("explains a colour it doesn't know", async () => {
    expect(
      await refused(empty(), "add_shape", { shape: "box", fill: "blurple" })
    ).toMatch(/isn't a colour I know/);
  });

  it("warns when the result sticks out of the canvas", async () => {
    const result = await ok(empty(), "add_shape", {
      shape: "box",
      x: 1800,
      y: 0,
      width: 300,
      height: 100,
    });
    expect(result.warnings?.[0]).toMatch(/past the right edge/);
  });
});

describe("add_text", () => {
  it("adds a text box with room for what it says", async () => {
    const session = empty();
    const result = await ok(session, "add_text", { text: "Hello" });
    const added = find(session, createdId(result));

    expect(added.type).toBe("textbox");
    expect(frameOf(added)).toMatchObject({ x: 660, width: 600, height: 67 });
    expect(session.selection()).toHaveLength(1);
  });

  it("grows with the text", async () => {
    const session = empty();
    const short = await ok(session, "add_text", { text: "Hi", width: 300 });
    const long = await ok(session, "add_text", {
      text: "word ".repeat(80),
      width: 300,
    });
    expect(frameOf(find(session, createdId(long))).height).toBeGreaterThan(
      frameOf(find(session, createdId(short))).height * 3
    );
  });

  it("makes each line its own block", async () => {
    const session = empty();
    const result = await ok(session, "add_text", { text: "one\ntwo\nthree" });
    const { document } = find(session, createdId(result)) as unknown as {
      document: { blocks: unknown[] };
    };
    expect(document.blocks).toHaveLength(3);
  });

  it("styles the text", async () => {
    const session = empty();
    const result = await ok(session, "add_text", {
      text: "Heart rate: $$heartRate$$",
      fontSize: 40,
      bold: true,
      color: "accent",
      align: "center",
    });
    const { document } = find(session, createdId(result)) as unknown as {
      document: {
        style: Record<string, unknown>;
        blocks: { style: { alignment: string } }[];
      };
    };
    expect(document.style).toMatchObject({
      fontSize: 40,
      fontWeight: "bold",
      textColor: PALETTE.accent,
    });
    expect(document.blocks[0].style.alignment).toBe("center");
  });

  it("needs some text", async () => {
    expect(await refused(empty(), "add_text", { text: "" })).toMatch(
      /Invalid arguments/
    );
  });
});

describe("add_button", () => {
  it("adds the primary button by default, centred", async () => {
    const session = empty();
    const result = await ok(session, "add_button", {});
    const added = find(session, createdId(result));

    expect(frameOf(added)).toEqual({ x: 750, y: 480, width: 420, height: 120 });
    expect(added.fill).toBe(`${PALETTE.accent}ff`);
    expect(added.clickable).toBe(true);
  });

  it("uses the chosen preset and label", async () => {
    const session = empty();
    const result = await ok(session, "add_button", {
      preset: "button-danger",
      label: "Call for help",
    });
    const added = find(session, createdId(result)) as unknown as {
      fill: string;
      document: { blocks: { spans: { text: string }[] }[] };
    };
    expect(added.fill).toBe(`${PALETTE.error}ff`);
    expect(added.document.blocks[0].spans[0].text).toBe("Call for help");
  });

  it("keeps the text readable when the fill is changed", async () => {
    const session = empty();
    const result = await ok(session, "add_button", { fill: "yellow" });
    const { document } = find(session, createdId(result)) as unknown as {
      document: { style: { textColor: string } };
    };
    expect(document.style.textColor).toBe(PALETTE.content);
  });

  it("can be moved, resized and made oval", async () => {
    const session = empty();
    const result = await ok(session, "add_button", {
      x: 10,
      y: 20,
      width: 200,
      height: 60,
      shape: "ellipse",
    });
    const added = find(session, createdId(result));
    expect(added.type).toBe("ellipse");
    expect(frameOf(added)).toEqual({ x: 10, y: 20, width: 200, height: 60 });
  });

  it("rejects a preset that doesn't exist", async () => {
    expect(
      await refused(empty(), "add_button", { preset: "button-sparkly" })
    ).toMatch(/Invalid arguments/);
  });
});

describe("add_library_item", () => {
  it("adds an icon at its natural size, centred", async () => {
    const session = empty();
    const result = await ok(session, "add_library_item", { itemId: "heart" });
    const added = find(session, createdId(result)) as unknown as {
      type: string;
      href: string;
    };

    expect(added.type).toBe("image");
    expect(added.href).toBe("/library/images/heart.png");
    expect(frameOf(find(session, createdId(result)))).toEqual({
      x: 704,
      y: 284,
      width: 512,
      height: 512,
    });
  });

  it("scales an icon to a width", async () => {
    const session = empty();
    const result = await ok(session, "add_library_item", {
      itemId: "check",
      width: 100,
      x: 0,
      y: 0,
    });
    expect(frameOf(find(session, createdId(result)))).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
  });

  it("adds a sound to the scene, not the canvas", async () => {
    const session = empty();
    const result = await ok(session, "add_library_item", {
      itemId: "heart-monitor",
    });
    expect(find(session, createdId(result))).toMatchObject({
      type: "audio",
      name: "Heart monitor",
      url: "/library/audio/heart-monitor.wav",
      loop: true,
    });
    expect(session.selection()).toEqual([]);
  });

  it("adds a button preset like add_button does", async () => {
    const session = empty();
    const result = await ok(session, "add_library_item", {
      itemId: "button-success",
    });
    expect(find(session, createdId(result)).fill).toBe(`${PALETTE.success}ff`);
  });

  it("rejects an id that isn't in the library", async () => {
    expect(
      await refused(empty(), "add_library_item", { itemId: "unicorn" })
    ).toMatch(/Invalid arguments/);
  });
});
