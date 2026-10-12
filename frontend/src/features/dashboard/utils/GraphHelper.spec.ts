import { describe, expect, it, vi } from "vitest";
import CreateGraphData from "./GraphHelper.js";

// the graph library is a React component library that Node can't load; the
// helper only needs the name of an arrowhead from it
vi.mock("@xyflow/react", () => ({
  MarkerType: { ArrowClosed: "arrowclosed" },
}));

const properties = [{ id: "hr", name: "heartRate", type: "number", value: 0 }];

const scene = (_id: string, name: string, components: object[] = []) => ({
  _id,
  name,
  components,
});
const button = (extra: object) => ({ id: "b", clickable: true, ...extra });
const rule = (comparator: string, value: number, sceneId: string) => ({
  stateVariableId: "hr",
  comparator,
  value,
  sceneId,
});
interface Edge {
  id: string;
  source: string;
  target: string;
  data: { branches: string[] };
}
const graph = (scenes: object[]) =>
  CreateGraphData(scenes, {}, properties) as { edges: Edge[] };
const branchesOf = (edges: Edge[], id: string) =>
  edges.find((e) => e.id === id)?.data.branches;

describe("CreateGraphData", () => {
  it("draws an edge for a button's scene", () => {
    const { edges } = graph([
      scene("a", "A", [button({ nextScene: "b" })]),
      scene("b", "B"),
    ]);
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ source: "a", target: "b" });
    expect(edges[0].data.branches).toEqual([]);
  });

  it("draws an edge for each rule, labelled with its condition", () => {
    const { edges } = graph([
      scene("a", "A", [
        button({
          nextScene: "stable",
          nextSceneRules: [rule(">", 120, "worse")],
        }),
      ]),
      scene("worse", "Worse"),
      scene("stable", "Stable"),
    ]);
    expect(edges.map((e) => e.id)).toEqual(["A-Worse", "A-Stable"]);
    expect(branchesOf(edges, "A-Worse")).toEqual(["heartRate > 120"]);
    expect(branchesOf(edges, "A-Stable")).toEqual(["otherwise"]);
  });

  it("gathers the conditions of rules that lead the same way", () => {
    const { edges } = graph([
      scene("a", "A", [
        button({
          nextSceneRules: [rule(">", 120, "worse"), rule("<", 40, "worse")],
        }),
      ]),
      scene("worse", "Worse"),
    ]);
    expect(edges).toHaveLength(1);
    expect(branchesOf(edges, "A-Worse")).toEqual([
      "heartRate > 120",
      "heartRate < 40",
    ]);
  });

  it("shows no condition on an edge that another button always takes", () => {
    const { edges } = graph([
      scene("a", "A", [
        button({ nextSceneRules: [rule(">", 1, "b")] }),
        button({ id: "plain", nextScene: "b" }),
      ]),
      scene("b", "B"),
    ]);
    expect(edges).toHaveLength(1);
    expect(branchesOf(edges, "A-B")).toEqual([]);
  });

  it("skips a rule whose scene no longer exists", () => {
    const { edges } = graph([
      scene("a", "A", [button({ nextSceneRules: [rule(">", 1, "gone")] })]),
    ]);
    expect(edges).toEqual([]);
  });
});
