import { describe, expect, it } from "vitest";
import { AiError, createAccumulator } from "../accumulate";

const delta = (part: unknown, finish: string | null = null) => ({
  choices: [{ delta: part, finish_reason: finish }],
});

describe("createAccumulator", () => {
  it("puts the pieces of text back together, giving each as it comes", () => {
    const acc = createAccumulator();
    expect(acc.add(delta({ content: "Hel" }))).toBe("Hel");
    expect(acc.add(delta({ content: "lo" }))).toBe("lo");
    expect(acc.result().message).toEqual({
      role: "assistant",
      content: "Hello",
    });
  });

  it("builds a tool call from arguments written a bit at a time", () => {
    const acc = createAccumulator();
    acc.add(
      delta({
        tool_calls: [
          { index: 0, id: "c1", function: { name: "move", arguments: "" } },
        ],
      })
    );
    acc.add(
      delta({
        tool_calls: [{ index: 0, function: { arguments: '{"targets":' } }],
      })
    );
    acc.add(
      delta(
        { tool_calls: [{ index: 0, function: { arguments: '["a"],"x":5}' } }] },
        "tool_calls"
      )
    );

    const { message, finishReason } = acc.result();
    expect(message.tool_calls).toEqual([
      {
        id: "c1",
        type: "function",
        function: { name: "move", arguments: '{"targets":["a"],"x":5}' },
      },
    ]);
    expect(message.content).toBeNull();
    expect(finishReason).toBe("tool_calls");
  });

  it("keeps several calls apart, in order", () => {
    const acc = createAccumulator();
    acc.add(
      delta({
        tool_calls: [
          { index: 1, id: "b", function: { name: "second", arguments: "{}" } },
        ],
      })
    );
    acc.add(
      delta({
        tool_calls: [
          { index: 0, id: "a", function: { name: "first", arguments: "{}" } },
        ],
      })
    );
    expect(
      acc.result().message.tool_calls?.map((c) => c.function.name)
    ).toEqual(["first", "second"]);
  });

  it("doesn't double a name that every piece repeats", () => {
    const acc = createAccumulator();
    acc.add(
      delta({
        tool_calls: [
          { index: 0, id: "c", function: { name: "move", arguments: "{" } },
        ],
      })
    );
    acc.add(
      delta({
        tool_calls: [{ index: 0, function: { name: "move", arguments: "}" } }],
      })
    );
    const [call] = acc.result().message.tool_calls ?? [];
    expect(call.function).toEqual({ name: "move", arguments: "{}" });
  });

  it("makes up an id when the provider doesn't send one, and drops a call with no name", () => {
    const acc = createAccumulator();
    acc.add(
      delta({
        tool_calls: [
          { index: 0, function: { name: "get_scene", arguments: "{}" } },
          { index: 1, function: { arguments: "{}" } },
        ],
      })
    );
    const calls = acc.result().message.tool_calls ?? [];
    expect(calls).toHaveLength(1);
    expect(calls[0].id).toBe("call_0");
  });

  it("keeps text and tool calls from one reply", () => {
    const acc = createAccumulator();
    acc.add(delta({ content: "Looking." }));
    acc.add(
      delta({
        tool_calls: [
          {
            index: 0,
            id: "c",
            function: { name: "get_scene", arguments: "{}" },
          },
        ],
      })
    );
    const { message } = acc.result();
    expect(message.content).toBe("Looking.");
    expect(message.tool_calls).toHaveLength(1);
  });

  it("reads the cost", () => {
    const acc = createAccumulator();
    acc.add({
      choices: [],
      usage: { prompt_tokens: 120, completion_tokens: 8 },
    });
    expect(acc.result().usage).toEqual({
      promptTokens: 120,
      completionTokens: 8,
    });
  });

  it("copes with a provider that sends whole messages rather than pieces", () => {
    const acc = createAccumulator();
    acc.add({
      choices: [
        {
          message: {
            content: "All at once",
            tool_calls: [
              { id: "c", function: { name: "get_scene", arguments: "{}" } },
            ],
          },
        },
      ],
    });
    const { message } = acc.result();
    expect(message.content).toBe("All at once");
    expect(message.tool_calls?.[0].function.name).toBe("get_scene");
  });

  it("ignores what it doesn't know, like a model's thinking", () => {
    const acc = createAccumulator();
    expect(acc.add(delta({ reasoning: "hmm", content: "Hi" }))).toBe("Hi");
    expect(acc.add(null)).toBe("");
    expect(acc.add("nonsense")).toBe("");
    expect(acc.result().message.content).toBe("Hi");
  });

  it("turns an error sent inside the stream into an AiError", () => {
    const acc = createAccumulator();
    expect(() =>
      acc.add({
        error: {
          message: "The AI took too long, so it was stopped.",
          code: "timeout",
        },
      })
    ).toThrowError(AiError);
    try {
      acc.add({ error: { message: "Cut off", code: "interrupted" } });
    } catch (error) {
      expect(error).toMatchObject({ message: "Cut off", code: "interrupted" });
    }
  });
});
