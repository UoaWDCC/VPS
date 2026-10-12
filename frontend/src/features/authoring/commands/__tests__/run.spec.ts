import { describe, expect, it, vi } from "vitest";
import { blankScene } from "../memory";
import { runBatch, runCommand } from "../run";
import {
  box,
  find,
  frameOf,
  ok,
  sceneOf,
  sessionFor,
  withText,
} from "./helpers";

const A = "aaaaaaaa-1111-4111-8111-111111111111";

describe("runCommand", () => {
  it("lists the commands when the name is wrong", async () => {
    const result = await runCommand(
      sessionFor(blankScene()),
      "make_it_pretty",
      {}
    );
    expect(result).toMatchObject({ ok: false, command: "make_it_pretty" });
    expect(result.error).toMatch(/get_scene.*add_shape/);
  });

  it("reports bad arguments without running anything", async () => {
    const session = sessionFor(sceneOf(box(A, 0, 0, 10, 10)));
    const result = await runCommand(session, "move", {
      targets: [A],
      dx: "far",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Invalid arguments for move/);
    expect(session.writes).toHaveLength(0);
  });

  it("turns a refusal into an error the model can read", async () => {
    const result = await runCommand(sessionFor(blankScene()), "move", {
      targets: ["nothing"],
      dx: 1,
    });
    expect(result).toMatchObject({ ok: false });
    expect(result.error).toMatch(/No component matches "nothing"/);
  });

  it("never throws, even when something unexpected breaks", async () => {
    const session = sessionFor(sceneOf(box(A, 0, 0, 10, 10)));
    const adapter = session.adapter("scene-1")!;
    session.adapter = () => ({
      ...adapter,
      write: () => {
        throw new Error("the disk is full");
      },
    });
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await runCommand(session, "move", { targets: [A], dx: 5 });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(
      /Something went wrong running move: the disk is full/
    );
    quiet.mockRestore();
  });

  it("changes nothing when it fails", async () => {
    const session = sessionFor(sceneOf(box(A, 0, 0, 10, 10)));
    const before = JSON.stringify(session.scene());
    await runCommand(session, "set_style", { targets: [A], fill: "blurple" });
    expect(JSON.stringify(session.scene())).toBe(before);
  });

  it("doesn't touch the scene it was handed while working on it", async () => {
    const session = sessionFor(sceneOf(box(A, 0, 0, 10, 10)));
    const before = session.scene();
    await ok(session, "move", { targets: [A], dx: 100 });
    // the memory session swaps in a new scene; the old one stayed as it was
    expect(frameOf(before.components[A])).toMatchObject({ x: 0 });
    expect(frameOf(session.scene().components[A])).toMatchObject({ x: 100 });
  });

  describe("results", () => {
    it("say what changed, with short ids", async () => {
      const session = sessionFor(
        sceneOf(box(A, 0, 0, 10, 10), box("bbbbbbbb-2", 0, 0, 10, 10))
      );
      const result = await ok(session, "move", { targets: [A], dx: 5 });
      expect(result.changed).toEqual({
        added: [],
        modified: ["aaaaaaaa"],
        removed: [],
        fields: [],
      });
      expect(result.command).toBe("move");
    });

    it("write nothing when nothing needed to change", async () => {
      const session = sessionFor(sceneOf(box(A, 100, 100, 10, 10)));
      const result = await ok(session, "move", { targets: [A], dx: 0 });
      expect(result.summary).toMatch(/nothing needed to change/);
      expect(session.writes).toHaveLength(0);
    });

    it("carry layout warnings for what was just changed, not for old problems", async () => {
      const session = sessionFor(
        sceneOf(box(A, 1800, 0, 300, 100), box("bbbbbbbb-2", 0, 0, 100, 100))
      );
      const result = await ok(session, "move", {
        targets: ["bbbbbbbb"],
        dx: 10,
      });
      // A was already off the canvas, but this didn't touch it
      expect(result.warnings).toBeUndefined();

      const worse = await ok(session, "move", { targets: [A], dx: 10 });
      expect(worse.warnings?.[0]).toMatch(/aaaaaaaa.*past the right edge/);
    });

    it("leave warnings out when there are none", async () => {
      const result = await ok(sessionFor(blankScene()), "add_shape", {
        shape: "box",
      });
      expect(result.warnings).toBeUndefined();
    });
  });

  describe("choosing a scene", () => {
    const other = () => sceneOf(box("other-box-1", 0, 0, 100, 100));
    const setup = () => {
      const second = other();
      second._id = "scene-2";
      second.name = "Ward round";
      return sessionFor(sceneOf(box(A, 0, 0, 10, 10)), { others: [second] });
    };

    it("acts on the open scene unless told otherwise", async () => {
      const session = setup();
      await ok(session, "add_shape", { shape: "box" });
      expect(Object.keys(session.scene("scene-1").components)).toHaveLength(2);
      expect(Object.keys(session.scene("scene-2").components)).toHaveLength(1);
    });

    it("can act on another scene, by name", async () => {
      const session = setup();
      await ok(session, "add_shape", { shape: "box", sceneId: "Ward round" });
      expect(Object.keys(session.scene("scene-2").components)).toHaveLength(2);
      expect(Object.keys(session.scene("scene-1").components)).toHaveLength(1);
    });

    it("resolves components within that scene", async () => {
      const session = setup();
      await ok(session, "move", {
        targets: ["other-box"],
        dx: 50,
        sceneId: "scene-2",
      });
      expect(
        frameOf(session.scene("scene-2").components["other-box-1"]).x
      ).toBe(50);
    });

    it("doesn't change the selection for another scene", async () => {
      const session = setup();
      await ok(session, "add_shape", { shape: "box", sceneId: "scene-2" });
      expect(session.selection()).toEqual([]);
    });

    it("says which scenes exist when the name is wrong", async () => {
      const result = await runCommand(setup(), "get_scene", {
        sceneId: "Discharge",
      });
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/Scene 1.*Ward round/);
    });
  });
});

describe("runBatch", () => {
  it("runs commands in order, each seeing what the last did", async () => {
    const session = sessionFor(blankScene());
    const { results, completed } = await runBatch(session, [
      { name: "add_button", args: { label: "Continue", x: 100, y: 100 } },
      // "selected" is the button the first command just made
      { name: "move", args: { targets: ["selected"], dx: 50 } },
      { name: "set_style", args: { targets: ["Continue"], fill: "success" } },
    ]);

    expect(completed).toBe(true);
    expect(results.map((r) => r.ok)).toEqual([true, true, true]);
    const [button] = Object.values(session.scene().components);
    expect(frameOf(button).x).toBe(150);
    expect(button).toMatchObject({ fill: "#367a2fff" });
  });

  it("is one batch, which is one undo step in the editor", async () => {
    const session = sessionFor(blankScene());
    await runBatch(session, [
      { name: "add_shape", args: { shape: "box" } },
      { name: "add_shape", args: { shape: "ellipse" } },
      { name: "add_text", args: { text: "Hi" } },
    ]);
    expect(session.batches()).toBe(1);
    expect(session.writes).toHaveLength(3);
  });

  it("stops at the first failure and says it didn't finish", async () => {
    const session = sessionFor(sceneOf(withText(box(A, 0, 0, 10, 10), "Real")));
    const { results, completed } = await runBatch(session, [
      { name: "move", args: { targets: ["Real"], dx: 5 } },
      { name: "move", args: { targets: ["Imaginary"], dx: 5 } },
      { name: "move", args: { targets: ["Real"], dx: 5 } },
    ]);

    expect(completed).toBe(false);
    expect(results.map((r) => r.ok)).toEqual([true, false]);
    // the first move stayed; the third never ran
    expect(frameOf(find(session, A)).x).toBe(5);
  });

  it("does nothing, successfully, for no commands", async () => {
    const session = sessionFor(blankScene());
    expect(await runBatch(session, [])).toEqual({
      results: [],
      completed: true,
    });
  });
});
