import { describe, expect, it } from "vitest";
import type { Component } from "../../types";
import {
  box,
  find,
  ok,
  refused,
  sceneOf,
  sessionFor,
  withText,
} from "./helpers";

const A = "aaaaaaaa-1111-4111-8111-111111111111";
const B = "bbbbbbbb-2222-4222-8222-222222222222";

type Doc = {
  document: {
    style: Record<string, unknown>;
    blocks: {
      style: Record<string, unknown>;
      spans: { style: Record<string, unknown>; text: string }[];
    }[];
  };
};

describe("set_style", () => {
  it("changes fill, outline and outline width", async () => {
    const session = sessionFor(sceneOf(box(A, 0, 0, 100, 100)));
    await ok(session, "set_style", {
      targets: [A],
      fill: "#ff0000",
      stroke: "blue",
      strokeWidth: 8,
    });
    expect(find(session, A)).toMatchObject({
      fill: "#ff0000ff",
      stroke: "#1e88e5ff",
      strokeWidth: 8,
    });
  });

  it("changes several at once, and understands 'selected'", async () => {
    const session = sessionFor(
      sceneOf(box(A, 0, 0, 100, 100), box(B, 200, 0, 100, 100)),
      {
        selection: [A, B],
      }
    );
    await ok(session, "set_style", { targets: ["selected"], fill: "success" });
    expect(find(session, A).fill).toBe(find(session, B).fill);
    expect(find(session, A).fill).not.toBe("#b7b7b7ff");
  });

  it("can clear a colour", async () => {
    const session = sessionFor(sceneOf(box(A, 0, 0, 100, 100)));
    await ok(session, "set_style", { targets: [A], fill: "transparent" });
    expect(find(session, A).fill).toBe("#00000000");
  });

  it("leaves a line's fill alone but takes its outline", async () => {
    const line = {
      ...box(A, 0, 0, 100, 0),
      type: "line",
      stroke: "#000000ff",
    } as Component;
    const session = sessionFor(sceneOf(line, box(B, 0, 100, 100, 100)));

    const result = await ok(session, "set_style", {
      targets: [A, B],
      fill: "red",
      stroke: "green",
    });
    expect(find(session, A)).toMatchObject({ stroke: "#43a047ff" });
    // the line's existing fill is not touched
    expect(find(session, A).fill).toBe("#b7b7b7ff");
    expect(find(session, B).fill).toBe("#e53935ff");
    expect(result.warnings?.join(" ")).toMatch(/has no fill/);
  });

  it("says so when nothing could be changed", async () => {
    const line = { ...box(A, 0, 0, 100, 0), type: "line" } as Component;
    const session = sessionFor(sceneOf(line));
    expect(
      await refused(session, "set_style", { targets: [A], fill: "red" })
    ).toMatch(/Nothing to change/);
  });

  it("needs something to change", async () => {
    const session = sessionFor(sceneOf(box(A, 0, 0, 100, 100)));
    expect(await refused(session, "set_style", { targets: [A] })).toMatch(
      /Invalid arguments/
    );
  });

  it("warns when the new fill makes the text unreadable", async () => {
    const session = sessionFor(
      sceneOf(withText(box(A, 0, 0, 300, 100), "Hello"))
    );
    const result = await ok(session, "set_style", {
      targets: [A],
      fill: "black",
    });
    expect(result.warnings?.join(" ")).toMatch(/hard to read/);
  });

  it("doesn't warn when the text still reads", async () => {
    const session = sessionFor(
      sceneOf(withText(box(A, 0, 0, 300, 100), "Hello"))
    );
    const result = await ok(session, "set_style", {
      targets: [A],
      fill: "yellow",
    });
    expect(result.warnings).toBeUndefined();
  });
});

describe("set_text", () => {
  it("replaces the words and keeps how they look", async () => {
    const styled = withText(box(A, 0, 0, 400, 100), "Old", {
      fontSize: 40,
      textColor: "#123456",
    });
    const session = sessionFor(sceneOf(styled));
    await ok(session, "set_text", { target: A, text: "New words" });

    const { document } = find(session, A) as unknown as Doc;
    expect(document.blocks[0].spans[0].text).toBe("New words");
    expect(document.style).toMatchObject({
      fontSize: 40,
      textColor: "#123456",
    });
  });

  it("makes each line a block", async () => {
    const session = sessionFor(sceneOf(withText(box(A, 0, 0, 400, 300), "x")));
    await ok(session, "set_text", { target: A, text: "one\ntwo" });
    const { document } = find(session, A) as unknown as Doc;
    expect(document.blocks.map((b) => b.spans[0].text)).toEqual(["one", "two"]);
  });

  it("finds the component by what it says now", async () => {
    const session = sessionFor(
      sceneOf(withText(box(A, 0, 0, 400, 100), "Continue"))
    );
    await ok(session, "set_text", { target: "Continue", text: "Proceed" });
    expect(
      (find(session, A) as unknown as Doc).document.blocks[0].spans[0].text
    ).toBe("Proceed");
  });

  it("gives a shape with no text a document, readable on its fill", async () => {
    const session = sessionFor(
      sceneOf(box(A, 0, 0, 400, 100, { fill: "#101010ff" }))
    );
    await ok(session, "set_text", { target: A, text: "Label" });
    const { document } = find(session, A) as unknown as Doc;
    expect(document.blocks[0].spans[0].text).toBe("Label");
    expect(document.style.textColor).toBe("#f4f4f1");
  });

  it("is refused for things that can't hold text", async () => {
    const image = { ...box(A, 0, 0, 100, 100), type: "image" } as Component;
    expect(
      await refused(sessionFor(sceneOf(image)), "set_text", {
        target: A,
        text: "x",
      })
    ).toMatch(/can't hold text/);
  });

  it("wants one component, not several", async () => {
    const session = sessionFor(
      sceneOf(
        withText(box(A, 0, 0, 100, 50), "Give a"),
        withText(box(B, 0, 100, 100, 50), "Give b")
      )
    );
    expect(
      await refused(session, "set_text", { target: "give", text: "x" })
    ).toMatch(/matches 2 components/);
  });
});

describe("set_text_style", () => {
  const styledScene = () => {
    const spanStyled = withText(box(A, 0, 0, 400, 100), "Hello", {
      fontSize: 20,
    });
    const doc = (spanStyled as unknown as Doc).document;
    doc.blocks[0].spans[0].style = { fontSize: 99, textColor: "#ff0000" };
    doc.blocks[0].style = { alignment: "left" };
    return sceneOf(spanStyled);
  };

  it("sets the base style", async () => {
    const session = sessionFor(
      sceneOf(withText(box(A, 0, 0, 400, 100), "Hello"))
    );
    await ok(session, "set_text_style", {
      targets: [A],
      fontFamily: "Georgia",
      fontSize: 48,
      bold: true,
      italic: true,
      underline: true,
      color: "#336699",
      align: "right",
      lineHeight: 1.5,
    });
    const { document } = find(session, A) as unknown as Doc;
    expect(document.style).toMatchObject({
      fontFamily: "Georgia",
      fontSize: 48,
      fontWeight: "bold",
      fontStyle: "italic",
      textDecoration: "underline",
      textColor: "#336699",
      alignment: "right",
      lineHeight: 1.5,
    });
  });

  it("takes effect even where text was styled one piece at a time", async () => {
    const session = sessionFor(styledScene());
    await ok(session, "set_text_style", {
      targets: [A],
      fontSize: 30,
      align: "center",
    });

    const { document } = find(session, A) as unknown as Doc;
    expect(document.style).toMatchObject({ fontSize: 30, alignment: "center" });
    expect(document.blocks[0].spans[0].style.fontSize).toBeUndefined();
    expect(document.blocks[0].style.alignment).toBeUndefined();
    // what wasn't asked about is left as it was
    expect(document.blocks[0].spans[0].style.textColor).toBe("#ff0000");
  });

  it("can turn bold off again", async () => {
    const session = sessionFor(
      sceneOf(withText(box(A, 0, 0, 400, 100), "Hello", { fontWeight: "bold" }))
    );
    await ok(session, "set_text_style", { targets: [A], bold: false });
    expect((find(session, A) as unknown as Doc).document.style.fontWeight).toBe(
      "normal"
    );
  });

  it("skips components with no text, and says so", async () => {
    const session = sessionFor(
      sceneOf(withText(box(A, 0, 0, 400, 100), "Hi"), box(B, 0, 200, 100, 100))
    );
    const result = await ok(session, "set_text_style", {
      targets: [A, B],
      bold: true,
    });
    expect(result.warnings?.join(" ")).toMatch(/has no text/);
  });

  it("refuses when there's nothing to change it on, or nothing asked", async () => {
    const session = sessionFor(
      sceneOf(box(A, 0, 0, 100, 100), withText(box(B, 0, 200, 100, 100), "x"))
    );
    expect(
      await refused(session, "set_text_style", { targets: [A], bold: true })
    ).toMatch(/Nothing to change/);
    expect(await refused(session, "set_text_style", { targets: [B] })).toMatch(
      /Say what to change/
    );
  });

  it("only offers the fonts the editor has", async () => {
    const session = sessionFor(sceneOf(withText(box(A, 0, 0, 100, 100), "x")));
    expect(
      await refused(session, "set_text_style", {
        targets: [A],
        fontFamily: "Comic Sans",
      })
    ).toMatch(/Invalid arguments/);
  });
});
