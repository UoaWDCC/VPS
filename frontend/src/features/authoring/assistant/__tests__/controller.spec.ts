import { beforeEach, describe, expect, it } from "vitest";
import {
  box,
  find,
  frameOf,
  sceneOf,
  sessionFor,
  withText,
} from "../../commands/__tests__/helpers";
import { AiError } from "../accumulate";
import {
  applyTicked,
  describeError,
  discardPlan,
  newConversation,
  send,
  setAssistantDeps,
  setStepTicked,
  stop,
} from "../controller";
import useAssistant, { type FeedItem, type Turn } from "../store";
import { noToolSupport, scriptedChat, type Scripted } from "./fakeModel";

const BUTTON = "aaaaaaaa-1111-4111-8111-111111111111";

function setup(script: Parameters<typeof scriptedChat>[0]) {
  const session = sessionFor(
    sceneOf(withText(box(BUTTON, 100, 100, 300, 100), "Continue"))
  );
  const model = scriptedChat(script);
  const locks: boolean[] = [];
  setAssistantDeps({
    scenarioId: "scenario-1",
    session,
    chat: model.chat,
    setLocked: (locked) => locks.push(locked),
  });
  return { session, model, locks };
}

const state = () => useAssistant.getState();
const turns = () =>
  state()
    .feed.filter(
      (item): item is Extract<FeedItem, { kind: "turn" }> =>
        item.kind === "turn"
    )
    .map((item) => item.turn);
const notes = () =>
  state()
    .feed.filter(
      (item): item is Extract<FeedItem, { kind: "note" }> =>
        item.kind === "note"
    )
    .map((item) => item.text);
const lastTurn = (): Turn => turns().at(-1) as Turn;

beforeEach(() => {
  setAssistantDeps(null);
  state().setRunning(false);
  newConversation();
  state().setMode("ask");
  state().setAllowance({ used: 0, limit: 0 });
});

describe("the assistant", () => {
  describe("a conversation", () => {
    it("shows what the author said and the reply", async () => {
      setup([{ content: "Two components." }]);
      await send("  What's in this scene?  ");

      expect(turns()).toHaveLength(1);
      expect(lastTurn()).toMatchObject({
        mode: "ask",
        user: "What's in this scene?",
        status: "done",
        blocks: [{ kind: "text", text: "Two components." }],
      });
      expect(state().running).toBe(false);
    });

    it("shows the tools it used, with what they did, between its words", async () => {
      setup([
        { content: "Let me look.", calls: [{ name: "get_scene" }] },
        { content: "Found it." },
      ]);
      await send("Look");

      const blocks = lastTurn().blocks;
      expect(blocks.map((b) => b.kind)).toEqual(["text", "tool", "text"]);
      expect(blocks[1]).toMatchObject({
        kind: "tool",
        tool: { name: "get_scene", status: "ok" },
      });
    });

    it("shows a tool that failed as failed", async () => {
      setup([{ calls: [{ name: "make_it_pretty" }] }, { content: "Sorry." }]);
      await send("Hi");
      expect(lastTurn().blocks[0]).toMatchObject({
        kind: "tool",
        tool: { status: "error" },
      });
    });

    it("ignores an empty message, and one sent while another is running", async () => {
      const { model } = setup([{ content: "ok" }]);
      await send("   ");
      expect(turns()).toHaveLength(0);

      state().setRunning(true);
      await send("Hello");
      expect(turns()).toHaveLength(0);
      expect(model.requests).toHaveLength(0);
    });

    it("does nothing without the editor behind it", async () => {
      await send("Hello");
      expect(turns()).toHaveLength(0);
    });
  });

  describe("remembering", () => {
    it("sends the earlier conversation with the next message, boiled down", async () => {
      const { model } = setup([
        { calls: [{ name: "get_scene" }, { name: "get_scenario" }] },
        { content: "It has one button." },
        { content: "Yes." },
      ]);
      await send("What's here?");
      await send("Are you sure?");

      const second = model.requests.at(-1)?.messages ?? [];
      // the system message, then the first turn as two plain messages, then the new question
      expect(second.map((m) => m.role)).toEqual([
        "system",
        "user",
        "assistant",
        "user",
      ]);
      expect(second[1]).toMatchObject({ content: "What's here?" });
      expect(second[2]).toMatchObject({ content: "It has one button." });
    });

    it("remembers what it changed, so it doesn't redo it", async () => {
      const { model } = setup([
        { calls: [{ name: "move", args: { targets: [BUTTON], x: 5 } }] },
        { content: "Moved." },
        { content: "ok" },
      ]);
      state().setMode("build");
      await send("Move it");
      await send("Thanks");

      const remembered = model.requests.at(-1)?.messages[2] as {
        content: string;
      };
      expect(remembered.content).toBe("Moved.\n\n[Done this turn: move]");
    });

    it("keeps only the latest few turns", async () => {
      setup(Array.from({ length: 12 }, (_, i) => ({ content: `reply ${i}` })));
      for (let i = 0; i < 12; i++) await send(`question ${i}`);
      expect(state().history).toHaveLength(16);
      expect(state().history[0]).toMatchObject({ content: "question 4" });
    });

    it("refreshes what it knows of the scene at every request", async () => {
      const { model } = setup([
        { calls: [{ name: "move", args: { targets: [BUTTON], x: 1500 } }] },
        { content: "ok" },
      ]);
      state().setMode("build");
      await send("Move it right");

      const system = (n: number) =>
        (model.requests[n].messages[0] as { content: string }).content;
      expect(system(0)).toContain('"x":100');
      expect(system(1)).toContain('"x":1500');
    });

    it("starts again when told to", async () => {
      setup([{ content: "hi" }]);
      await send("Hello");
      newConversation();
      expect(state().feed).toEqual([]);
      expect(state().history).toEqual([]);
    });
  });

  describe("Ask", () => {
    it("can't change anything, even if the model tries", async () => {
      const { session } = setup([
        { calls: [{ name: "move", args: { targets: [BUTTON], x: 999 } }] },
        { content: "Switch to Build." },
      ]);
      await send("Move it");
      expect(frameOf(find(session, BUTTON)).x).toBe(100);
      expect(session.writes).toHaveLength(0);
    });
  });

  describe("Build", () => {
    beforeEach(() => state().setMode("build"));

    it("changes the scenario as it goes, as one undo step", async () => {
      const { session } = setup([
        { calls: [{ name: "move", args: { targets: [BUTTON], x: 50 } }] },
        { calls: [{ name: "move", args: { targets: [BUTTON], y: 400 } }] },
        { calls: [{ name: "add_button", args: { label: "Next" } }] },
        { content: "Done." },
      ]);
      await send("Rearrange");

      expect(frameOf(find(session, BUTTON))).toMatchObject({ x: 50, y: 400 });
      expect(Object.keys(session.scene().components)).toHaveLength(2);
      expect(session.batches()).toBe(1);
    });

    it("keeps the author out of the scene while it works, and lets them back in", async () => {
      const { locks } = setup([{ content: "ok" }]);
      await send("Do it");
      expect(locks).toEqual([true, false]);
    });

    it("lets them back in even if it all goes wrong", async () => {
      const { locks } = setup([
        { error: new AiError("Down", { status: 502 }) },
      ]);
      await send("Do it");
      expect(locks.at(-1)).toBe(false);
      expect(lastTurn().status).toBe("error");
    });

    it("doesn't lock the scene in Ask or Plan", async () => {
      const { locks } = setup([{ content: "a" }, { content: "b" }]);
      state().setMode("ask");
      await send("one");
      state().setMode("plan");
      await send("two");
      expect(locks.filter(Boolean)).toHaveLength(0);
    });

    describe("deleting", () => {
      const deleting: Scripted[] = [
        { calls: [{ name: "delete_components", args: { targets: [BUTTON] } }] },
        { content: "Handled." },
      ];

      it("waits for the author, and does it when they say yes", async () => {
        const { session } = setup(deleting);
        const sending = send("Delete the button");
        await waitFor(() => state().confirm !== null);

        expect(state().confirm?.description).toMatch(/Delete 1 component/);
        expect(session.scene().components[BUTTON]).toBeDefined();

        state().confirm?.resolve(true);
        await sending;
        expect(session.scene().components[BUTTON]).toBeUndefined();
        expect(state().confirm).toBeNull();
      });

      it("leaves it alone when they say no", async () => {
        const { session } = setup(deleting);
        const sending = send("Delete the button");
        await waitFor(() => state().confirm !== null);
        state().confirm?.resolve(false);
        await sending;

        expect(session.scene().components[BUTTON]).toBeDefined();
        expect(lastTurn().blocks[0]).toMatchObject({
          tool: { status: "declined" },
        });
      });

      it("counts as no if the author presses Stop instead", async () => {
        const { session } = setup(deleting);
        const sending = send("Delete the button");
        await waitFor(() => state().confirm !== null);
        stop();
        await sending;

        expect(session.scene().components[BUTTON]).toBeDefined();
        expect(lastTurn().status).toBe("stopped");
      });
    });
  });

  describe("Stop", () => {
    it("ends the turn, keeps what was done, and says it was stopped", async () => {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      const { session } = setup([
        { calls: [{ name: "move", args: { targets: [BUTTON], x: 10 } }] },
        { until: gate, content: "never" },
      ]);
      state().setMode("build");

      const sending = send("Move it");
      await waitFor(
        () =>
          lastTurn()?.blocks.length === 1 &&
          lastTurn().blocks[0].kind === "tool"
      );
      await waitFor(() => state().running);
      stop();
      release();
      await sending;

      expect(lastTurn().status).toBe("stopped");
      expect(frameOf(find(session, BUTTON)).x).toBe(10);
      expect(state().running).toBe(false);
    });
  });

  describe("when something goes wrong", () => {
    it("says what the server said", async () => {
      setup([
        {
          error: new AiError(
            "You've used all 200 of today's AI requests. They reset at midnight UTC.",
            {
              status: 429,
            }
          ),
        },
      ]);
      await send("Hi");
      expect(lastTurn()).toMatchObject({
        status: "error",
        error:
          "You've used all 200 of today's AI requests. They reset at midnight UTC.",
      });
    });

    it("says what's missing when the server isn't set up", () => {
      expect(
        describeError(
          new AiError("The AI assistant isn't set up on this server yet.", {
            status: 503,
            meta: { missing: ["OPENROUTER_API_KEY", "OPENROUTER_MODEL"] },
          })
        )
      ).toBe(
        "The AI assistant isn't set up on this server yet. It needs OPENROUTER_API_KEY and OPENROUTER_MODEL set on the server."
      );
    });

    it("doesn't pass on a surprise as if it knew what it was", () => {
      expect(describeError(new Error("boom"))).toBe(
        "Something went wrong: boom"
      );
    });

    it("tells the author when it had to ask the model for tools as text", async () => {
      setup([{ error: noToolSupport() }, { content: "Hello." }]);
      await send("Hi");
      expect(notes().join(" ")).toMatch(/can't call tools itself/);
      expect(state().toolMode).toBe("json");
    });

    it("shows today's allowance", async () => {
      setup([{ content: "ok", allowance: { used: 7, limit: 200 } }]);
      await send("Hi");
      expect(state().allowance).toEqual({ used: 7, limit: 200 });
    });
  });

  describe("Plan", () => {
    beforeEach(() => state().setMode("plan"));

    const planning: Scripted[] = [
      {
        calls: [
          { name: "add_button", args: { label: "Next", x: 800, y: 100 } },
        ],
      },
      { calls: [{ name: "move", args: { targets: [BUTTON], x: 50 } }] },
      { content: "I'd add a Next button and nudge Continue left." },
    ];

    it("changes nothing real, and lists what it would do", async () => {
      const { session } = setup(planning);
      await send("Add a next button");

      expect(Object.keys(session.scene().components)).toHaveLength(1);
      expect(frameOf(find(session, BUTTON)).x).toBe(100);
      expect(session.writes).toHaveLength(0);

      expect(state().plan?.steps.map((s) => s.name)).toEqual([
        "add_button",
        "move",
      ]);
      expect(state().plan?.selected).toEqual(["step-1", "step-2"]);
    });

    it("applies the ticked changes as one undo step", async () => {
      const { session } = setup(planning);
      await send("Add a next button");
      await applyTicked();

      expect(Object.keys(session.scene().components)).toHaveLength(2);
      expect(frameOf(find(session, BUTTON)).x).toBe(50);
      expect(session.batches()).toBe(1);
      expect(state().plan).toBeNull();
      expect(notes().join(" ")).toMatch(
        /Applied 2 changes. One undo takes them all back./
      );
    });

    it("applies only what's ticked", async () => {
      const { session } = setup(planning);
      await send("Add a next button");
      setStepTicked("step-2", false);
      await applyTicked();

      expect(Object.keys(session.scene().components)).toHaveLength(2);
      expect(frameOf(find(session, BUTTON)).x).toBe(100);
    });

    it("ticks and unticks steps that go together", async () => {
      // the second call moves the button the first call made, by the id it was told
      const usesNewButton = (request: {
        messages: { role: string; content?: unknown }[];
      }): Scripted => {
        const result = JSON.parse(
          request.messages.at(-1)?.content as string
        ) as {
          output: { created: { id: string }[] };
        };
        return {
          calls: [
            {
              name: "move",
              args: { targets: [result.output.created[0].id], y: 600 },
            },
          ],
        };
      };
      const { session } = setup([
        { calls: [{ name: "add_button", args: { label: "Next" } }] },
        usesNewButton,
        { content: "Planned." },
      ]);
      await send("Add a button, then lower it");

      expect(state().plan?.steps.map((s) => s.dependsOn)).toEqual([
        [],
        ["step-1"],
      ]);

      setStepTicked("step-1", false);
      expect(state().plan?.selected).toEqual([]);

      setStepTicked("step-2", true);
      expect(state().plan?.selected.sort()).toEqual(["step-1", "step-2"]);

      await applyTicked();
      const added = Object.values(session.scene().components).find(
        (c) => c.id !== BUTTON
      );
      expect(frameOf(added as Parameters<typeof frameOf>[0]).y).toBe(600);
    });

    it("tells the author what it couldn't do, and still does the rest", async () => {
      const { session } = setup(planning);
      await send("Add a next button");
      // the author deletes the button meanwhile
      delete session.scene().components[BUTTON];
      await applyTicked();

      expect(notes().some((note) => /^Couldn't move/.test(note))).toBe(true);
      expect(Object.keys(session.scene().components)).toHaveLength(1);
    });

    it("builds on an earlier plan that hasn't been applied", async () => {
      const { model } = setup([
        { calls: [{ name: "add_button", args: { label: "One" } }] },
        { content: "ok" },
        { calls: [{ name: "get_scene" }] },
        { content: "I see the button I planned." },
      ]);
      await send("Add a button");
      await send("What do you see?");

      const system = (model.requests[2].messages[0] as { content: string })
        .content;
      expect(system).toContain('"text":"One"');
      expect(state().plan?.steps).toHaveLength(1);
    });

    it("can be thrown away", async () => {
      const { session } = setup(planning);
      await send("Add a next button");
      discardPlan();

      expect(state().plan).toBeNull();
      await applyTicked();
      expect(Object.keys(session.scene().components)).toHaveLength(1);
    });

    it("makes no plan when nothing would change", async () => {
      setup([
        { calls: [{ name: "get_scene" }] },
        { content: "Nothing to change." },
      ]);
      await send("Is anything wrong?");
      expect(state().plan).toBeNull();
    });
  });
});

async function waitFor(check: () => boolean, ms = 2000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error("timed out waiting");
}
