import { describe, expect, it } from "@jest/globals";

import { createStreamTap } from "../stream.js";

const encoder = new TextEncoder();
const bytes = (text) => encoder.encode(text);
const event = (data) => `data: ${JSON.stringify(data)}\n\n`;

function tapOf(...chunks) {
  const tap = createStreamTap();
  chunks.forEach((chunk) => tap.push(bytes(chunk)));
  tap.end();
  return tap.result();
}

describe("createStreamTap", () => {
  it("finds the cost of the reply", () => {
    const result = tapOf(
      event({ choices: [{ delta: { content: "Hi" } }] }),
      event({
        choices: [],
        usage: { prompt_tokens: 120, completion_tokens: 8, total_tokens: 128 },
      }),
      "data: [DONE]\n\n"
    );
    expect(result.usage).toEqual({ promptTokens: 120, completionTokens: 8 });
  });

  it("has no usage when the reply doesn't say", () => {
    expect(
      tapOf(event({ choices: [{ delta: { content: "Hi" } }] })).usage
    ).toBe(null);
  });

  it("collects the names of the tools it called, once each", () => {
    const call = (name) => ({
      choices: [
        {
          delta: {
            tool_calls: [{ index: 0, function: { name, arguments: "" } }],
          },
        },
      ],
    });
    const argumentsOnly = {
      choices: [
        {
          delta: { tool_calls: [{ index: 0, function: { arguments: "{}" } }] },
        },
      ],
    };
    const result = tapOf(
      event(call("get_scene")),
      event(argumentsOnly),
      event(call("move")),
      event(call("get_scene"))
    );
    expect(result.toolNames).toEqual(["get_scene", "move"]);
  });

  it("notes why the reply ended", () => {
    expect(
      tapOf(event({ choices: [{ delta: {}, finish_reason: "tool_calls" }] }))
        .finishReason
    ).toBe("tool_calls");
  });

  it("notes an error the provider sent inside the stream", () => {
    const result = tapOf(event({ error: { message: "Provider overloaded" } }));
    expect(result.error).toBe("Provider overloaded");
  });

  it("copes with events split across chunks, even mid-character", () => {
    const text = event({ usage: { prompt_tokens: 5, completion_tokens: 2 } });
    const all = bytes(text);
    const tap = createStreamTap();
    for (let i = 0; i < all.length; i += 3) tap.push(all.slice(i, i + 3));
    tap.end();
    expect(tap.result().usage).toEqual({
      promptTokens: 5,
      completionTokens: 2,
    });
  });

  it("copes with several events in one chunk and CRLF line ends", () => {
    const result = tapOf(
      `data: ${JSON.stringify({ choices: [{ finish_reason: "stop" }] })}\r\n\r\n` +
        event({ usage: { prompt_tokens: 1, completion_tokens: 1 } })
    );
    expect(result.finishReason).toBe("stop");
    expect(result.usage.promptTokens).toBe(1);
  });

  it("reads a last event that has no blank line after it", () => {
    const tap = createStreamTap();
    tap.push(bytes(`data: ${JSON.stringify({ usage: { prompt_tokens: 9 } })}`));
    tap.end();
    expect(tap.result().usage.promptTokens).toBe(9);
  });

  it("ignores comments, [DONE] and things that aren't JSON", () => {
    const result = tapOf(
      ": OPENROUTER PROCESSING\n\n",
      "data: not json at all\n\n",
      "event: ping\n\n",
      "data: [DONE]\n\n"
    );
    expect(result).toEqual({
      usage: null,
      toolNames: [],
      finishReason: null,
      error: null,
      events: 0,
    });
  });

  it("doesn't grow without end on a stream with no line breaks", () => {
    const tap = createStreamTap();
    const chunk = bytes("x".repeat(400000));
    for (let i = 0; i < 5; i++) tap.push(chunk);
    tap.end();
    expect(tap.result().events).toBe(0);
  });
});
