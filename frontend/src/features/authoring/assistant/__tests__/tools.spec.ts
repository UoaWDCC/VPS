import { describe, expect, it } from "vitest";
import {
  box,
  find,
  frameOf,
  sceneOf,
  sessionFor,
  withText,
} from "../../commands/__tests__/helpers";
import { describeCall, runTool, type ToolRunContext } from "../tools";

const A = "aaaaaaaa-1111-4111-8111-111111111111";
const B = "bbbbbbbb-2222-4222-8222-222222222222";

function context(extra: Partial<ToolRunContext> = {}) {
  const session = sessionFor(
    sceneOf(
      withText(box(A, 100, 100, 300, 100), "Continue"),
      box(B, 600, 100, 300, 100)
    )
  );
  return {
    session,
    context: { mode: "build", session, ...extra } as ToolRunContext,
  };
}

const parsed = (content: string) =>
  JSON.parse(content) as Record<string, unknown>;

describe("runTool", () => {
  describe("arguments as the model sends them", () => {
    it("takes an object", async () => {
      const { context: c, session } = context();
      const outcome = await runTool(c, "move", { targets: [A], x: 5 });
      expect(outcome.ok).toBe(true);
      expect(frameOf(find(session, A)).x).toBe(5);
    });

    it("takes JSON text, which is what a streamed call gives", async () => {
      const { context: c, session } = context();
      await runTool(c, "move", '{"targets": ["aaaaaaaa"], "x": 7}');
      expect(frameOf(find(session, A)).x).toBe(7);
    });

    it("takes JSON that was written as text inside text", async () => {
      const { context: c, session } = context();
      await runTool(
        c,
        "move",
        JSON.stringify('{"targets": ["aaaaaaaa"], "x": 9}')
      );
      expect(frameOf(find(session, A)).x).toBe(9);
    });

    it.each(["", "   ", null, undefined, "null"])(
      "takes %j as no arguments",
      async (raw) => {
        const { context: c } = context();
        const outcome = await runTool(c, "get_scene", raw);
        expect(outcome.ok).toBe(true);
      }
    );

    it("explains JSON it can't read", async () => {
      const { context: c, session } = context();
      const outcome = await runTool(c, "move", '{"targets": [');
      expect(outcome.ok).toBe(false);
      expect(parsed(outcome.content).error).toMatch(
        /aren't valid JSON.*Call move again/
      );
      expect(session.writes).toHaveLength(0);
    });

    it.each(["[1, 2]", "42", '"hello"'])(
      "explains arguments that aren't an object: %s",
      async (raw) => {
        const { context: c } = context();
        const outcome = await runTool(c, "move", raw);
        expect(outcome.ok).toBe(false);
        expect(parsed(outcome.content).error).toMatch(/one JSON object/);
      }
    );
  });

  describe("which tools", () => {
    it("says when there's no such tool, and lists those there are", async () => {
      const { context: c } = context();
      const outcome = await runTool(c, "sparkle", {});
      expect(parsed(outcome.content).error).toMatch(
        /no tool called "sparkle".*get_scene.*move/
      );
    });

    it("says when the mode doesn't allow it", async () => {
      const { context: c, session } = context({ mode: "ask" });
      const outcome = await runTool(c, "move", { targets: [A], x: 5 });
      expect(outcome.ok).toBe(false);
      expect(parsed(outcome.content).error).toMatch(
        /move isn't available in ask mode/
      );
      expect(session.writes).toHaveLength(0);
    });

    it("lets ask look", async () => {
      const { context: c } = context({ mode: "ask" });
      expect((await runTool(c, "get_scene", {})).ok).toBe(true);
    });
  });

  describe("what the model is told", () => {
    it("is the result, as compact JSON", async () => {
      const { context: c } = context();
      const outcome = await runTool(c, "move", { targets: [A], x: 5 });
      expect(parsed(outcome.content)).toMatchObject({
        ok: true,
        summary: expect.stringContaining("Moved") as unknown,
      });
      expect(outcome.content).not.toContain("\n");
    });

    it("includes warnings", async () => {
      const { context: c } = context();
      const outcome = await runTool(c, "move", { targets: [A], x: 1800 });
      expect(outcome.warnings?.join(" ")).toMatch(/past the right edge/);
      expect(parsed(outcome.content).warnings).toBeDefined();
    });

    it("is cut when it's very long, with a note", async () => {
      const crowd = Array.from({ length: 400 }, (_, i) =>
        box(`id${i}-0000-4000-8000-000000000000`, 0, 0, 10, 10)
      );
      const big = sessionFor(sceneOf(...crowd));
      const outcome = await runTool(
        { mode: "ask", session: big },
        "get_scene",
        {}
      );
      expect(outcome.content.length).toBeLessThan(15000);
      expect(outcome.content).toMatch(/cut: \d+ more characters/);
    });
  });

  describe("deleting", () => {
    it("asks first when it can, describing what's about to go", async () => {
      const asked: string[] = [];
      const { context: c, session } = context({
        confirm: (request) => {
          asked.push(request.description);
          return Promise.resolve(true);
        },
      });
      await runTool(c, "delete_components", { targets: [A, B] });

      expect(asked[0]).toMatch(/^Delete 2 components from "Scene 1": /);
      expect(asked[0]).toContain('box "Continue"');
      // no ids: they mean nothing to an author
      expect(asked[0]).not.toMatch(/[0-9a-f]{8}/);
      expect(Object.keys(session.scene().components)).toEqual([]);
    });

    it("does nothing, and says so, when the author declines", async () => {
      const { context: c, session } = context({
        confirm: () => Promise.resolve(false),
      });
      const outcome = await runTool(c, "delete_components", { targets: [A] });

      expect(outcome).toMatchObject({ ok: false, declined: true });
      expect(parsed(outcome.content).error).toMatch(/author said no/);
      expect(session.scene().components[A]).toBeDefined();
    });

    it("doesn't ask about things that aren't destructive", async () => {
      let asked = 0;
      const { context: c } = context({
        confirm: () => {
          asked++;
          return Promise.resolve(true);
        },
      });
      await runTool(c, "move", { targets: [A], x: 5 });
      await runTool(c, "get_scene", {});
      expect(asked).toBe(0);
    });

    it("describes a deletion it can't work out, without failing", () => {
      const { session } = context();
      expect(
        describeCall(session, "delete_components", { targets: ["nothing"] })
      ).toMatch(/^delete_components /);
      expect(describeCall(session, "delete_components", {})).toMatch(
        /^delete_components /
      );
    });
  });

  it("uses a different way of running commands when told to", async () => {
    const seen: string[] = [];
    const { context: c, session } = context({
      execute: (name) => {
        seen.push(name);
        return Promise.resolve({
          ok: true,
          command: name,
          summary: "pretended",
        });
      },
    });
    const outcome = await runTool(c, "move", { targets: [A], x: 5 });
    expect(seen).toEqual(["move"]);
    expect(outcome.summary).toBe("pretended");
    expect(session.writes).toHaveLength(0);
  });
});
