import { describe, expect, it } from "@jest/globals";

import { aiConfig } from "../config.js";
import { parseChatRequest } from "../request.js";

const SCENARIO = "507f1f77bcf86cd799439011";

const config = aiConfig({
  OPENROUTER_API_KEY: "key",
  OPENROUTER_MODEL: "vendor/main",
  OPENROUTER_FAST_MODEL: "vendor/fast",
  AI_MAX_OUTPUT_TOKENS: "1000",
  AI_MAX_INPUT_CHARS: "5000",
});

const tool = (name) => ({
  type: "function",
  function: { name, description: "d", parameters: { type: "object" } },
});

const request = (extra = {}) => ({
  scenarioId: SCENARIO,
  mode: "build",
  messages: [{ role: "user", content: "hi" }],
  ...extra,
});

/** The status and message of the error a request is refused with. */
function refusal(body, settings = config) {
  try {
    parseChatRequest(body, settings);
  } catch (error) {
    return { status: error.status, message: error.message };
  }
  throw new Error("the request was accepted");
}

describe("parseChatRequest", () => {
  it("accepts a plain chat request", () => {
    const parsed = parseChatRequest(request(), config);
    expect(parsed).toMatchObject({
      scenarioId: SCENARIO,
      mode: "build",
      model: "main",
      toolNames: [],
    });
    expect(parsed.upstream).toEqual({
      model: "vendor/main",
      messages: [{ role: "user", content: "hi" }],
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: 1000,
    });
  });

  describe("what is sent on", () => {
    it("only passes on the fields it knows", () => {
      const { upstream } = parseChatRequest(
        request({
          provider: { order: ["expensive"] },
          transforms: ["middle-out"],
          route: "fallback",
          user: "someone",
          stream: false,
          uid: "x",
        }),
        config
      );
      expect(Object.keys(upstream).sort()).toEqual([
        "max_tokens",
        "messages",
        "model",
        "stream",
        "stream_options",
      ]);
      expect(upstream.stream).toBe(true);
    });

    it("picks the model from main or fast, never by name", () => {
      expect(
        parseChatRequest(request({ model: "fast" }), config).upstream.model
      ).toBe("vendor/fast");
      expect(refusal(request({ model: "vendor/expensive" })).status).toBe(400);
    });

    it("uses the main model when there's no fast one", () => {
      const noFast = aiConfig({
        OPENROUTER_API_KEY: "key",
        OPENROUTER_MODEL: "vendor/main",
      });
      expect(
        parseChatRequest(request({ model: "fast" }), noFast).upstream.model
      ).toBe("vendor/main");
    });

    it("never lets the reply be longer than the server allows", () => {
      const tokens = (max_tokens) =>
        parseChatRequest(request({ max_tokens }), config).upstream.max_tokens;
      expect(tokens(200)).toBe(200);
      expect(tokens(999999)).toBe(1000);
      expect(tokens(-5)).toBe(1000);
      expect(tokens("lots")).toBe(1000);
      expect(tokens(undefined)).toBe(1000);
    });

    it("passes the temperature on when it's sensible", () => {
      expect(
        parseChatRequest(request({ temperature: 0.2 }), config).upstream
          .temperature
      ).toBe(0.2);
      expect(refusal(request({ temperature: 9 })).status).toBe(400);
    });
  });

  describe("the request itself", () => {
    it("needs a scenario", () => {
      expect(refusal(request({ scenarioId: undefined })).status).toBe(400);
      expect(refusal(request({ scenarioId: "nope" })).status).toBe(400);
      expect(refusal(request({ scenarioId: { $ne: "x" } })).status).toBe(400);
    });

    it("needs a real mode", () => {
      expect(refusal(request({ mode: "admin" })).message).toMatch(/mode/);
      expect(refusal(request({ mode: undefined })).status).toBe(400);
    });

    it("needs messages with roles it knows", () => {
      expect(refusal(request({ messages: [] })).status).toBe(400);
      expect(refusal(request({ messages: "hi" })).status).toBe(400);
      expect(refusal(request({ messages: ["hi"] })).status).toBe(400);
      expect(
        refusal(request({ messages: [{ role: "god", content: "hi" }] })).message
      ).toMatch(/role/);
      expect(
        refusal(request({ messages: [{ role: "user", content: { a: 1 } }] }))
          .status
      ).toBe(400);
    });

    it("lets an assistant message with tool calls have no text", () => {
      const messages = [
        { role: "user", content: "hi" },
        { role: "assistant", content: null, tool_calls: [] },
        { role: "tool", tool_call_id: "1", content: "{}" },
      ];
      expect(() =>
        parseChatRequest(request({ messages }), config)
      ).not.toThrow();
    });

    it("refuses a request that is too big", () => {
      const big = request({
        messages: [{ role: "user", content: "x".repeat(6000) }],
      });
      expect(refusal(big).status).toBe(413);
    });

    it("refuses a body that isn't one", () => {
      expect(refusal(undefined).status).toBe(400);
      expect(refusal("hi").status).toBe(400);
    });
  });

  describe("tools", () => {
    it("passes on the tools the mode allows", () => {
      const parsed = parseChatRequest(
        request({ tools: [tool("get_scene"), tool("move")] }),
        config
      );
      expect(parsed.toolNames).toEqual(["get_scene", "move"]);
      expect(parsed.upstream.tools).toHaveLength(2);
    });

    it("refuses a tool the mode doesn't allow, naming it", () => {
      const refused = refusal(
        request({ mode: "ask", tools: [tool("get_scene"), tool("move")] })
      );
      expect(refused.status).toBe(403);
      expect(refused.message).toBe(
        'The tool "move" isn\'t available in ask mode'
      );
    });

    it("refuses a tool that doesn't exist", () => {
      const refused = refusal(request({ tools: [tool("format_disk")] }));
      expect(refused.status).toBe(400);
      expect(refused.message).toBe('Unknown tool "format_disk"');
    });

    it("refuses tools that aren't functions", () => {
      expect(refusal(request({ tools: [{ type: "code" }] })).status).toBe(400);
      expect(refusal(request({ tools: "get_scene" })).status).toBe(400);
      expect(refusal(request({ tools: [null] })).status).toBe(400);
    });

    it("keeps a tool's definition as it was sent", () => {
      const definition = tool("get_scene");
      const { upstream } = parseChatRequest(
        request({ tools: [definition] }),
        config
      );
      expect(upstream.tools[0]).toEqual(definition);
    });

    describe("tool_choice", () => {
      it("passes on the plain choices", () => {
        for (const choice of ["auto", "none", "required"]) {
          const parsed = parseChatRequest(
            request({ tools: [tool("get_scene")], tool_choice: choice }),
            config
          );
          expect(parsed.upstream.tool_choice).toBe(choice);
        }
      });

      it("passes on a choice of one of the tools offered", () => {
        const parsed = parseChatRequest(
          request({
            tools: [tool("get_scene")],
            tool_choice: {
              type: "function",
              function: { name: "get_scene", extra: 1 },
            },
          }),
          config
        );
        expect(parsed.upstream.tool_choice).toEqual({
          type: "function",
          function: { name: "get_scene" },
        });
      });

      it("refuses a choice of a tool that wasn't offered", () => {
        expect(
          refusal(
            request({
              mode: "ask",
              tools: [tool("get_scene")],
              tool_choice: { type: "function", function: { name: "move" } },
            })
          ).status
        ).toBe(400);
      });

      it("refuses anything else", () => {
        expect(
          refusal(
            request({ tools: [tool("get_scene")], tool_choice: "sometimes" })
          ).status
        ).toBe(400);
      });

      it("is dropped when there are no tools", () => {
        const parsed = parseChatRequest(
          request({ tool_choice: "auto" }),
          config
        );
        expect(parsed.upstream.tool_choice).toBeUndefined();
      });
    });
  });
});
