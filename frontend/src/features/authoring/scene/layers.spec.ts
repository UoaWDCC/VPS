import { describe, expect, it } from "vitest";
import { box } from "../commands/__tests__/helpers";
import { computeLayerChanges } from "./layers";

// a at the back, d at the front
const stack = () => [
  box("a", 0, 0, 1, 1, { zIndex: 0 }),
  box("b", 0, 0, 1, 1, { zIndex: 1 }),
  box("c", 0, 0, 1, 1, { zIndex: 2 }),
  box("d", 0, 0, 1, 1, { zIndex: 3 }),
];

const apply = (changes: { id: string; zIndex: number }[]) => {
  const components = stack();
  changes.forEach(({ id, zIndex }) => {
    components.find((c) => c.id === id)!.zIndex = zIndex;
  });
  return components.sort((x, y) => x.zIndex - y.zIndex).map((c) => c.id);
};

describe("computeLayerChanges", () => {
  it("brings something to the front", () => {
    expect(
      apply(computeLayerChanges(stack(), ["a"], "forward", "extreme"))
    ).toEqual(["b", "c", "d", "a"]);
  });

  it("sends something to the back", () => {
    expect(
      apply(computeLayerChanges(stack(), ["d"], "backward", "extreme"))
    ).toEqual(["d", "a", "b", "c"]);
  });

  it("steps forward and backward one at a time", () => {
    expect(
      apply(computeLayerChanges(stack(), ["b"], "forward", "step"))
    ).toEqual(["a", "c", "b", "d"]);
    expect(
      apply(computeLayerChanges(stack(), ["c"], "backward", "step"))
    ).toEqual(["a", "c", "b", "d"]);
  });

  it("moves a group together and keeps its order", () => {
    expect(
      apply(computeLayerChanges(stack(), ["a", "b"], "forward", "extreme"))
    ).toEqual(["c", "d", "a", "b"]);
    expect(
      apply(computeLayerChanges(stack(), ["a", "b"], "forward", "step"))
    ).toEqual(["c", "a", "b", "d"]);
  });

  it("reports nothing when there's nowhere to go", () => {
    expect(computeLayerChanges(stack(), ["d"], "forward", "extreme")).toEqual(
      []
    );
    expect(computeLayerChanges(stack(), ["d"], "forward", "step")).toEqual([]);
    expect(computeLayerChanges(stack(), ["a"], "backward", "step")).toEqual([]);
    expect(computeLayerChanges(stack(), [], "forward", "step")).toEqual([]);
  });

  it("only rewrites the components whose layer actually changes", () => {
    const changes = computeLayerChanges(stack(), ["b"], "forward", "step");
    expect(changes.map((c) => c.id).sort()).toEqual(["b", "c"]);
  });

  it("untangles components sharing a layer by renumbering them", () => {
    const tied = [
      box("a", 0, 0, 1, 1, { zIndex: 0 }),
      box("b", 0, 0, 1, 1, { zIndex: 0 }),
      box("c", 0, 0, 1, 1, { zIndex: 0 }),
    ];
    const changes = computeLayerChanges(tied, ["a"], "forward", "extreme");
    const order = tied
      .map((c) => ({
        id: c.id,
        z: changes.find((x) => x.id === c.id)?.zIndex ?? c.zIndex,
      }))
      .sort((x, y) => x.z - y.z)
      .map((c) => c.id);
    expect(order).toEqual(["b", "c", "a"]);
  });
});
