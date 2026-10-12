import { describe, expect, it } from "vitest";
import { describeTools, parseTextToolCalls } from "../textTools";
import { toolsForMode } from "../modes";

const KNOWN = ["move", "get_scene", "set_style"];

describe("parseTextToolCalls", () => {
  it("reads a call that is the whole reply", () => {
    const found = parseTextToolCalls(
      '{"tool": "move", "arguments": {"targets": ["a"], "x": 5}}',
      KNOWN
    );
    expect(found).toEqual({
      calls: [{ name: "move", arguments: { targets: ["a"], x: 5 } }],
      rest: "",
    });
  });

  it("reads a call in a code block, and leaves the rest of the words", () => {
    const found = parseTextToolCalls(
      'I\'ll move it.\n```json\n{"tool": "move", "arguments": {"x": 1}}\n```\nThen I\'ll check.',
      KNOWN
    );
    expect(found?.calls).toEqual([{ name: "move", arguments: { x: 1 } }]);
    expect(found?.rest).toBe("I'll move it.\n\nThen I'll check.");
  });

  it("reads a list of calls, in order", () => {
    const found = parseTextToolCalls(
      '[{"tool": "get_scene", "arguments": {}}, {"tool": "move", "arguments": {"x": 1}}]',
      KNOWN
    );
    expect(found?.calls.map((c) => c.name)).toEqual(["get_scene", "move"]);
  });

  it("reads several separate calls in the text", () => {
    const found = parseTextToolCalls(
      '{"tool": "get_scene", "arguments": {}} and then {"tool": "move", "arguments": {"x": 1}}',
      KNOWN
    );
    expect(found?.calls.map((c) => c.name)).toEqual(["get_scene", "move"]);
  });

  it.each([
    ["name and args", '{"name": "move", "args": {"x": 2}}'],
    ["function and parameters", '{"function": "move", "parameters": {"x": 2}}'],
    [
      "the OpenAI shape",
      '{"type": "function", "function": {"name": "move", "arguments": {"x": 2}}}',
    ],
    [
      "tool_calls wrapped",
      '{"tool_calls": [{"function": {"name": "move", "arguments": "{\\"x\\": 2}"}}]}',
    ],
  ])("reads the way some models write it: %s", (_name, text) => {
    const call = parseTextToolCalls(text, KNOWN)?.calls[0];
    expect(call?.name).toBe("move");
    expect(
      typeof call?.arguments === "string"
        ? JSON.parse(call.arguments)
        : call?.arguments
    ).toEqual({ x: 2 });
  });

  it("copes with braces and quotes inside the arguments", () => {
    const found = parseTextToolCalls(
      '{"tool": "move", "arguments": {"text": "a } \\" { b"}}',
      KNOWN
    );
    expect(found?.calls[0].arguments).toEqual({ text: 'a } " { b' });
  });

  it("ignores JSON that isn't a call to one of the tools", () => {
    expect(
      parseTextToolCalls('{"tool": "format_disk", "arguments": {}}', KNOWN)
    ).toBeNull();
    expect(
      parseTextToolCalls('Here: {"width": 100, "height": 50}', KNOWN)
    ).toBeNull();
    expect(parseTextToolCalls("[1, 2, 3]", KNOWN)).toBeNull();
    expect(parseTextToolCalls("Just words, no calls.", KNOWN)).toBeNull();
    expect(parseTextToolCalls("", KNOWN)).toBeNull();
  });

  it("ignores a call that's broken", () => {
    expect(
      parseTextToolCalls('{"tool": "move", "arguments": {"x": ', KNOWN)
    ).toBeNull();
  });
});

describe("describeTools", () => {
  it("lists each tool with what it takes, and leaves a ? on what's optional", () => {
    const text = describeTools(toolsForMode("build"));
    expect(text).toMatch(/- move \{/);
    expect(text).toMatch(/targets: string\[\]/);
    expect(text).toMatch(/x\?: number/);
    expect(text).toContain("- get_scene");
  });

  it("only lists the tools it's given", () => {
    const text = describeTools(toolsForMode("ask"));
    expect(text).toContain("- get_scene");
    expect(text).not.toContain("- move ");
    expect(text).not.toContain("delete_components");
  });

  it("writes out the choices when there are only a few", () => {
    expect(describeTools(toolsForMode("build"))).toMatch(
      /"=" \| "!=" \| ">" \| "<"/
    );
  });
});
