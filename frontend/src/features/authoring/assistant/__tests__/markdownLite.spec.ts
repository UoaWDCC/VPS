import { describe, expect, it } from "vitest";
import { parseInline, parseRichText } from "../markdownLite";

describe("parseInline", () => {
  it("finds bold, italic and code", () => {
    expect(parseInline("a **b** c *d* e `f` g")).toEqual([
      { kind: "text", text: "a " },
      { kind: "bold", text: "b" },
      { kind: "text", text: " c " },
      { kind: "italic", text: "d" },
      { kind: "text", text: " e " },
      { kind: "code", text: "f" },
      { kind: "text", text: " g" },
    ]);
  });

  it("leaves a lone asterisk or an unfinished mark as it is", () => {
    expect(parseInline("2 * 3 and **half")).toEqual([
      { kind: "text", text: "2 * 3 and **half" },
    ]);
  });

  it("is only text for plain text", () => {
    expect(parseInline("hello")).toEqual([{ kind: "text", text: "hello" }]);
    expect(parseInline("")).toEqual([]);
  });

  it("doesn't read marks inside code", () => {
    expect(parseInline("`**x**`")).toEqual([{ kind: "code", text: "**x**" }]);
  });
});

describe("parseRichText", () => {
  it("makes paragraphs, keeping line breaks inside one", () => {
    const blocks = parseRichText("First line\nsecond line\n\nNext paragraph");
    expect(blocks.map((b) => b.kind)).toEqual(["paragraph", "paragraph"]);
    expect(blocks[0]).toMatchObject({
      inline: [{ text: "First line\nsecond line" }],
    });
  });

  it("reads bullet and numbered lists", () => {
    const blocks = parseRichText("- one\n- **two**\n\n1. first\n2) second");
    expect(blocks).toMatchObject([
      {
        kind: "list",
        ordered: false,
        items: [[{ text: "one" }], [{ kind: "bold", text: "two" }]],
      },
      {
        kind: "list",
        ordered: true,
        items: [[{ text: "first" }], [{ text: "second" }]],
      },
    ]);
  });

  it("reads headings as plain emphasised lines", () => {
    expect(parseRichText("## Summary\nText")).toMatchObject([
      { kind: "heading", inline: [{ text: "Summary" }] },
      { kind: "paragraph" },
    ]);
  });

  it("reads a table, dropping the line of dashes", () => {
    const [table] = parseRichText(
      "| Name | Type |\n|------|------|\n| **Next** | box |\n| Calm | box |"
    );
    expect(table).toMatchObject({
      kind: "table",
      header: [[{ text: "Name" }], [{ text: "Type" }]],
      rows: [
        [[{ kind: "bold", text: "Next" }], [{ text: "box" }]],
        [[{ text: "Calm" }], [{ text: "box" }]],
      ],
    });
  });

  it("reads a code block, even one that isn't closed yet", () => {
    expect(parseRichText('```json\n{"a": 1}\n```')).toEqual([
      { kind: "code", text: '{"a": 1}' },
    ]);
    expect(parseRichText("```\nstill arriving")).toEqual([
      { kind: "code", text: "still arriving" },
    ]);
  });

  it("copes with the reply a real model gave", () => {
    const blocks = parseRichText(
      [
        "**Triage scene** has 4 components:",
        "",
        "| Component | Type | Where it leads |",
        "|-----------|------|----------------|",
        "| **btn-next** | box | **Stable** |",
        "",
        "**Buttons that lead to another scene:**",
        "- **Next** → Stable",
        "- **Calm down** → Stable",
        "",
        'The "Plain link" button does nothing.',
      ].join("\n")
    );
    expect(blocks.map((b) => b.kind)).toEqual([
      "paragraph",
      "table",
      "paragraph",
      "list",
      "paragraph",
    ]);
  });

  it("is empty for empty text", () => {
    expect(parseRichText("")).toEqual([]);
    expect(parseRichText("\n\n")).toEqual([]);
  });

  it("never makes markup from what's written", () => {
    const [block] = parseRichText('<img src=x onerror="alert(1)"> **bold**');
    expect(JSON.stringify(block)).toContain("<img src=x");
    expect(block.kind).toBe("paragraph");
  });
});
