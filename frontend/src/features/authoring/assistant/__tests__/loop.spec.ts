import { describe, expect, it } from "vitest";
import {
  box,
  find,
  frameOf,
  sceneOf,
  sessionFor,
  withText,
} from "../../commands/__tests__/helpers";
import type { MemorySession } from "../../commands/memory";
import { AiError } from "../accumulate";
import { runTurn, type TurnEvent, type TurnOptions } from "../loop";
import { noToolSupport, scriptedChat, type Scripted } from "./fakeModel";

interface ToolResult {
  ok: boolean;
  error?: string;
}

const BUTTON = "aaaaaaaa-1111-4111-8111-111111111111";
const OTHER = "bbbbbbbb-2222-4222-8222-222222222222";

function setup() {
  return sessionFor(
    sceneOf(
      withText(box(BUTTON, 100, 100, 300, 100), "Continue"),
      box(OTHER, 600, 100, 300, 100)
    )
  );
}

function turn(
  script: Parameters<typeof scriptedChat>[0],
  options: Partial<TurnOptions> & { session?: MemorySession } = {}
) {
  const session = options.session ?? setup();
  const model = scriptedChat(script);
  const events: TurnEvent[] = [];
  const run = () =>
    runTurn({
      mode: "build",
      scenarioId: "scenario-1",
      systemFor: (toolMode) => `system (${toolMode})`,
      history: [],
      userMessage: "Move the button right",
      chat: model.chat,
      session,
      onEvent: (event) => events.push(event),
      ...options,
    });
  return { session, model, events, run };
}

const names = (events: TurnEvent[], type: TurnEvent["type"]) =>
  events.filter((e) => e.type === type);

describe("runTurn", () => {
  describe("a plain answer", () => {
    it("is one request, and the reply streams to the screen", async () => {
      const { run, model, events } = turn([
        { content: "The scene has two boxes." },
      ]);
      const result = await run();

      expect(result.finish).toBe("done");
      expect(result.text).toBe("The scene has two boxes.");
      expect(result.steps).toBe(1);
      expect(model.requests).toHaveLength(1);

      const shown = events
        .filter(
          (e): e is Extract<TurnEvent, { type: "text" }> => e.type === "text"
        )
        .map((e) => e.delta)
        .join("");
      expect(shown).toBe("The scene has two boxes.");
      expect(names(events, "text_set")).toHaveLength(0);
    });

    it("sends the rules, the earlier conversation and then the author's words", async () => {
      const { run, model } = turn([{ content: "ok" }], {
        history: [
          { role: "user", content: "Hi" },
          { role: "assistant", content: "Hello" },
        ],
      });
      await run();

      expect(model.requests[0].messages).toEqual([
        { role: "system", content: "system (native)" },
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello" },
        { role: "user", content: "Move the button right" },
      ]);
      expect(model.requests[0]).toMatchObject({
        scenarioId: "scenario-1",
        mode: "build",
      });
    });

    it("offers the tools the mode allows, and no others", async () => {
      const toolNames = async (mode: "ask" | "build") => {
        const { run, model } = turn([{ content: "ok" }], { mode });
        await run();
        return (
          model.requests[0].tools as { function: { name: string } }[]
        ).map((t) => t.function.name);
      };
      const ask = await toolNames("ask");
      const build = await toolNames("build");

      expect(ask).toContain("get_scene");
      expect(ask).not.toContain("move");
      expect(ask).not.toContain("delete_components");
      expect(build).toContain("move");
      expect(build).toContain("delete_components");
    });
  });

  describe("using tools", () => {
    it("runs what the model asks for and sends the results back", async () => {
      const { run, model, session, events } = turn([
        { calls: [{ name: "move", args: { targets: [BUTTON], x: 800 } }] },
        { content: "Moved it." },
      ]);
      const result = await run();

      expect(result.finish).toBe("done");
      expect(result.steps).toBe(2);
      expect(frameOf(find(session, BUTTON))).toMatchObject({ x: 800 });

      // the second request carries the call and its result
      const second = model.requests[1].messages;
      const assistant = second.at(-2);
      const tool = second.at(-1);
      expect(assistant).toMatchObject({
        role: "assistant",
        tool_calls: [{ function: { name: "move" } }],
      });
      expect(tool).toMatchObject({ role: "tool" });
      expect(tool && "tool_call_id" in tool && tool.tool_call_id).toBe(
        assistant && "tool_calls" in assistant
          ? assistant.tool_calls?.[0].id
          : undefined
      );
      expect(JSON.parse((tool as { content: string }).content)).toMatchObject({
        ok: true,
      });

      const order = events
        .map((e) => e.type)
        .filter((type, i, all) => type !== all[i - 1]);
      expect(order).toEqual(["step", "tool_start", "tool_end", "step", "text"]);
    });

    it("runs several calls in one reply, in order", async () => {
      const { run, session } = turn([
        {
          calls: [
            { name: "move", args: { targets: [BUTTON], x: 50 } },
            { name: "move", args: { targets: [BUTTON], y: 400 } },
          ],
        },
        { content: "Done." },
      ]);
      await run();
      expect(frameOf(find(session, BUTTON))).toMatchObject({ x: 50, y: 400 });
    });

    it("keeps the turn's messages for the model's memory", async () => {
      const { run } = turn([
        { calls: [{ name: "get_scene" }] },
        { content: "Two components." },
      ]);
      const result = await run();
      expect(result.messages.map((m) => m.role)).toEqual([
        "user",
        "assistant",
        "tool",
        "assistant",
      ]);
    });

    it("reports a tool's warnings", async () => {
      const { run, events } = turn([
        { calls: [{ name: "move", args: { targets: [BUTTON], x: 1800 } }] },
        { content: "ok" },
      ]);
      await run();
      const end = names(events, "tool_end")[0] as Extract<
        TurnEvent,
        { type: "tool_end" }
      >;
      expect(end.ok).toBe(true);
      expect(end.warnings?.join(" ")).toMatch(/past the right edge/);
    });
  });

  describe("when the model gets it wrong", () => {
    const toolMessages = (messages: { role: string; content?: unknown }[]) =>
      messages
        .filter((m) => m.role === "tool")
        .map((m) => JSON.parse(m.content as string) as ToolResult);

    it("tells it, rather than crashing, when the arguments aren't JSON", async () => {
      const { run, model } = turn([
        { calls: [{ name: "move", args: "{targets: [oops" }] },
        { calls: [{ name: "move", args: { targets: [BUTTON], x: 10 } }] },
        { content: "Fixed." },
      ]);
      const result = await run();

      expect(result.finish).toBe("done");
      const [failure] = toolMessages(model.requests[1].messages);
      expect(failure.ok).toBe(false);
      expect(failure.error).toMatch(/aren't valid JSON/);
    });

    it("tells it when a tool doesn't exist, listing the ones that do", async () => {
      const { run, model } = turn([
        { calls: [{ name: "make_it_pretty" }] },
        { content: "Sorry." },
      ]);
      await run();
      const [failure] = toolMessages(model.requests[1].messages);
      expect(failure.error).toMatch(/no tool called "make_it_pretty"/);
      expect(failure.error).toMatch(/get_scene/);
    });

    it("passes on what a command says is wrong with the arguments", async () => {
      const { run, model } = turn([
        {
          calls: [
            { name: "move", args: { targets: ["nothing-like-this"], x: 10 } },
          ],
        },
        { content: "Hm." },
      ]);
      await run();
      const [failure] = toolMessages(model.requests[1].messages);
      expect(failure.ok).toBe(false);
      expect(failure.error).toMatch(/No component matches/);
    });

    it("won't run a tool the mode doesn't allow, even if the model asks", async () => {
      const { run, model, session } = turn(
        [
          { calls: [{ name: "move", args: { targets: [BUTTON], x: 999 } }] },
          { content: "I can't change things in Ask mode." },
        ],
        { mode: "ask" }
      );
      await run();

      const [failure] = toolMessages(model.requests[1].messages);
      expect(failure.error).toMatch(/move isn't available in ask mode/);
      expect(session.writes).toHaveLength(0);
    });

    it("carries on after an argument object that has the wrong shape", async () => {
      const { run } = turn([
        { calls: [{ name: "move", args: "[1, 2]" }] },
        { content: "ok" },
      ]);
      expect((await run()).finish).toBe("done");
    });
  });

  describe("the step cap", () => {
    it("stops a model that never stops calling tools", async () => {
      const forever = Array.from({ length: 10 }, () => ({
        calls: [{ name: "get_scene" }],
      }));
      const { run, model } = turn(forever, { maxSteps: 3 });
      const result = await run();

      expect(result.finish).toBe("step_limit");
      expect(result.steps).toBe(3);
      expect(model.requests).toHaveLength(3);
    });

    it("is 15 steps by default", async () => {
      const forever = Array.from({ length: 30 }, () => ({
        calls: [{ name: "get_scene" }],
      }));
      const { run, model } = turn(forever);
      expect((await run()).finish).toBe("step_limit");
      expect(model.requests).toHaveLength(15);
    });
  });

  describe("Stop", () => {
    it("ends the turn at once, keeping what had been said", async () => {
      const controller = new AbortController();
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      const { run, model } = turn(
        [{ until: gate, content: "never shown" }, { content: "never asked" }],
        { signal: controller.signal }
      );

      const pending = run();
      controller.abort();
      release();
      const result = await pending;

      expect(result.finish).toBe("stopped");
      expect(model.requests).toHaveLength(1);
    });

    it("stops between one tool and the next, leaving the first done", async () => {
      const controller = new AbortController();
      const session = setup();
      const { run } = turn(
        [
          {
            calls: [
              { name: "move", args: { targets: [BUTTON], x: 50 } },
              { name: "move", args: { targets: [OTHER], x: 50 } },
            ],
          },
          { content: "never asked" },
        ],
        {
          session,
          signal: controller.signal,
          onEvent: (event) => {
            if (event.type === "tool_end") controller.abort();
          },
        }
      );
      const result = await run();

      expect(result.finish).toBe("stopped");
      expect(frameOf(find(session, BUTTON))).toMatchObject({ x: 50 });
      expect(frameOf(find(session, OTHER))).toMatchObject({ x: 600 });
    });

    it("doesn't start if it was already stopped", async () => {
      const controller = new AbortController();
      controller.abort();
      const { run, model } = turn([{ content: "x" }], {
        signal: controller.signal,
      });
      expect((await run()).finish).toBe("stopped");
      expect(model.requests).toHaveLength(0);
    });
  });

  describe("deleting", () => {
    const deleteCall: Scripted = {
      calls: [{ name: "delete_components", args: { targets: [OTHER] } }],
    };

    it("asks first in Build mode, and deletes when the author agrees", async () => {
      const asked: string[] = [];
      const { run, session } = turn([deleteCall, { content: "Deleted." }], {
        confirm: (request) => {
          asked.push(request.description);
          return Promise.resolve(true);
        },
      });
      await run();

      expect(asked).toHaveLength(1);
      expect(asked[0]).toMatch(/Delete 1 component from "Scene 1"/);
      expect(session.scene().components[OTHER]).toBeUndefined();
    });

    it("leaves it alone, and tells the model, when the author says no", async () => {
      const { run, session, model, events } = turn(
        [deleteCall, { content: "Left it." }],
        { confirm: () => Promise.resolve(false) }
      );
      await run();

      expect(session.scene().components[OTHER]).toBeDefined();
      const tool = model.requests[1].messages.at(-1) as { content: string };
      expect((JSON.parse(tool.content) as ToolResult).error).toMatch(
        /author said no/
      );
      const end = names(events, "tool_end")[0] as Extract<
        TurnEvent,
        { type: "tool_end" }
      >;
      expect(end).toMatchObject({ ok: false, declined: true });
    });
  });

  describe("when the model can't be reached", () => {
    it("ends the turn with the error, keeping what happened before", async () => {
      const failure = new AiError("You've used all of today's AI requests.", {
        status: 429,
      });
      const { run } = turn([
        { calls: [{ name: "get_scene" }] },
        { error: failure },
      ]);
      const result = await run();

      expect(result.finish).toBe("error");
      expect(result.error).toBe(failure);
      expect(result.messages.map((m) => m.role)).toEqual([
        "user",
        "assistant",
        "tool",
      ]);
    });
  });

  describe("for models that can't call tools themselves", () => {
    it("switches to reading calls from the reply's text, and tries again", async () => {
      const { run, model, session, events } = turn([
        { error: noToolSupport() },
        {
          content:
            '{"tool": "move", "arguments": {"targets": ["' +
            BUTTON +
            '"], "x": 700}}',
        },
        { content: "Moved it." },
      ]);
      const result = await run();

      expect(result.finish).toBe("done");
      expect(result.toolMode).toBe("json");
      expect(result.steps).toBe(2);
      expect(names(events, "tool_mode")).toHaveLength(1);
      expect(frameOf(find(session, BUTTON))).toMatchObject({ x: 700 });

      // the retry asks without tools, and with the way to call them in the rules
      expect(model.requests[0].tools).toBeDefined();
      expect(model.requests[1].tools).toBeUndefined();
      expect(model.requests[1].messages[0]).toEqual({
        role: "system",
        content: "system (json)",
      });

      // results come back as an ordinary message, not a tool message
      const last = model.requests[2].messages.at(-1);
      expect(last).toMatchObject({ role: "user" });
      expect((last as { content: string }).content).toMatch(
        /^Tool results:\nmove:/
      );
    });

    it("doesn't show the JSON as if the assistant had said it", async () => {
      const { run, events } = turn([
        { error: noToolSupport() },
        { content: '```json\n{"tool": "get_scene", "arguments": {}}\n```' },
        { content: "Two components." },
      ]);
      await run();

      const shown = events
        .map((e) =>
          e.type === "text" ? e.delta : e.type === "text_set" ? e.text : ""
        )
        .join("");
      expect(shown).not.toContain("get_scene");
      expect(shown).toContain("Two components.");
    });

    it("also reads a call a model wrote in its text when it could have used a tool", async () => {
      const { run, session } = turn([
        {
          content: `Sure. {"tool": "move", "arguments": {"targets": ["${BUTTON}"], "x": 20}}`,
        },
        { content: "Done." },
      ]);
      const result = await run();

      expect(frameOf(find(session, BUTTON))).toMatchObject({ x: 20 });
      expect(result.finish).toBe("done");
    });

    it("replaces the text it showed once it sees the rest was a call", async () => {
      const { run, events } = turn([
        {
          content: `Moving it now. {"tool": "get_scene", "arguments": {}}`,
        },
        { content: "Done." },
      ]);
      await run();
      expect(names(events, "text_set")[0]).toMatchObject({
        text: "Moving it now.",
      });
    });

    it("only switches once", async () => {
      const { run } = turn([
        { error: noToolSupport() },
        { error: noToolSupport() },
      ]);
      const result = await run();
      expect(result.finish).toBe("error");
    });

    it("doesn't switch for an error that isn't about tools", async () => {
      const { run, model } = turn([
        {
          error: new AiError("busy", {
            status: 502,
            meta: { message: "Provider overloaded" },
          }),
        },
      ]);
      const result = await run();
      expect(result.finish).toBe("error");
      expect(model.requests).toHaveLength(1);
    });
  });

  describe("bookkeeping", () => {
    it("adds up what the replies cost and reports today's allowance", async () => {
      const { run, events } = turn([
        {
          calls: [{ name: "get_scene" }],
          usage: { promptTokens: 100, completionTokens: 10 },
          allowance: { used: 4, limit: 200 },
        },
        {
          content: "ok",
          usage: { promptTokens: 150, completionTokens: 5 },
          allowance: { used: 5, limit: 200 },
        },
      ]);
      const result = await run();

      expect(result.usage).toEqual({ promptTokens: 250, completionTokens: 15 });
      expect(
        names(events, "allowance").map(
          (e) => (e as { allowance: unknown }).allowance
        )
      ).toEqual([
        { used: 4, limit: 200 },
        { used: 5, limit: 200 },
      ]);
    });
  });
});
