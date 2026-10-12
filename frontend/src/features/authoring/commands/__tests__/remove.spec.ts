import { describe, expect, it } from "vitest";
import { box, ok, refused, sceneOf, sessionFor, withText } from "./helpers";

const A = "aaaaaaaa-1111-4111-8111-111111111111";
const B = "bbbbbbbb-2222-4222-8222-222222222222";
const C = "cccccccc-3333-4333-8333-333333333333";

describe("delete_components", () => {
  it("removes what it's pointed at and nothing else", async () => {
    const session = sessionFor(
      sceneOf(box(A, 0, 0, 10, 10), box(B, 0, 0, 10, 10), box(C, 0, 0, 10, 10))
    );
    const result = await ok(session, "delete_components", { targets: [A, C] });

    expect(Object.keys(session.scene().components)).toEqual([B]);
    expect(result.changed).toMatchObject({
      removed: ["aaaaaaaa", "cccccccc"],
      added: [],
      modified: [],
    });
  });

  it("finds components by what they say", async () => {
    const session = sessionFor(
      sceneOf(withText(box(A, 0, 0, 10, 10), "Delete me"), box(B, 0, 0, 10, 10))
    );
    await ok(session, "delete_components", { targets: ["delete me"] });
    expect(Object.keys(session.scene().components)).toEqual([B]);
  });

  it("drops deleted things from the selection but keeps the rest", async () => {
    const session = sessionFor(
      sceneOf(box(A, 0, 0, 10, 10), box(B, 0, 0, 10, 10)),
      { selection: [A, B] }
    );
    await ok(session, "delete_components", { targets: [A] });
    expect(session.selection()).toEqual([B]);
  });

  it("deletes nothing when a reference doesn't resolve", async () => {
    const session = sessionFor(sceneOf(box(A, 0, 0, 10, 10)));
    expect(
      await refused(session, "delete_components", {
        targets: [A, "zzzz-no-such-thing"],
      })
    ).toMatch(/No component matches/);
    expect(Object.keys(session.scene().components)).toEqual([A]);
  });

  it("won't guess between components", async () => {
    const session = sessionFor(
      sceneOf(box("abcd1111-1", 0, 0, 10, 10), box("abcd2222-2", 0, 0, 10, 10))
    );
    expect(
      await refused(session, "delete_components", { targets: ["abcd"] })
    ).toMatch(/more than one/);
    expect(Object.keys(session.scene().components)).toHaveLength(2);
  });

  it("can empty a scene", async () => {
    const session = sessionFor(sceneOf(box(A, 0, 0, 10, 10)));
    await ok(session, "delete_components", { targets: [A] });
    expect(session.scene().components).toEqual({});
  });
});
