import { describe, expect, it } from "@jest/globals";

import {
  destinationSceneIds,
  resolveDestination,
  ruleMatches,
} from "../destination.js";

const properties = [
  { id: "hr", name: "heartRate", type: "number", value: 120 },
  { id: "name", name: "patient", type: "string", value: "Sam" },
  { id: "fluids", name: "fluidsGiven", type: "boolean", value: true },
];

const rule = (stateVariableId, comparator, value, sceneId = "target") => ({
  stateVariableId,
  comparator,
  value,
  sceneId,
});

describe("ruleMatches", () => {
  describe("numbers", () => {
    it.each([
      ["=", 120, true],
      ["=", 121, false],
      ["!=", 121, true],
      ["!=", 120, false],
      [">", 119, true],
      [">", 120, false],
      ["<", 121, true],
      ["<", 120, false],
    ])("%s %s is %s", (comparator, value, expected) => {
      expect(ruleMatches(rule("hr", comparator, value), properties)).toBe(
        expected
      );
    });

    it("never matches a number that isn't one", () => {
      const broken = [{ id: "hr", type: "number", value: NaN }];
      expect(ruleMatches(rule("hr", "!=", 5), broken)).toBe(false);
      expect(ruleMatches(rule("hr", "=", NaN), broken)).toBe(false);
    });
  });

  describe("text", () => {
    it("compares for equality, and only equality", () => {
      expect(ruleMatches(rule("name", "=", "Sam"), properties)).toBe(true);
      expect(ruleMatches(rule("name", "=", "sam"), properties)).toBe(false);
      expect(ruleMatches(rule("name", "!=", "Alex"), properties)).toBe(true);
      expect(ruleMatches(rule("name", ">", "A"), properties)).toBe(false);
      expect(ruleMatches(rule("name", "<", "Z"), properties)).toBe(false);
    });
  });

  describe("true/false", () => {
    it("compares for equality, and only equality", () => {
      expect(ruleMatches(rule("fluids", "=", true), properties)).toBe(true);
      expect(ruleMatches(rule("fluids", "=", false), properties)).toBe(false);
      expect(ruleMatches(rule("fluids", "!=", false), properties)).toBe(true);
      expect(ruleMatches(rule("fluids", ">", false), properties)).toBe(false);
    });
  });

  describe("rules that can't be judged never match", () => {
    it("when the property is gone", () => {
      expect(ruleMatches(rule("deleted", "=", 1), properties)).toBe(false);
      expect(ruleMatches(rule("deleted", "!=", 1), properties)).toBe(false);
    });

    it("when the value is a different type to the property", () => {
      expect(ruleMatches(rule("hr", "=", "120"), properties)).toBe(false);
      expect(ruleMatches(rule("hr", "!=", "120"), properties)).toBe(false);
      expect(ruleMatches(rule("fluids", "=", "true"), properties)).toBe(false);
    });

    it("when the comparator isn't one of the four", () => {
      expect(ruleMatches(rule("hr", ">=", 120), properties)).toBe(false);
      expect(ruleMatches(rule("hr", undefined, 120), properties)).toBe(false);
    });

    it("when there is nothing to judge", () => {
      expect(ruleMatches(undefined, properties)).toBe(false);
      expect(ruleMatches(rule("hr", "=", 120), undefined)).toBe(false);
    });
  });
});

describe("resolveDestination", () => {
  const button = (rules, nextScene = "fallback") => ({
    id: "b",
    clickable: true,
    nextScene,
    nextSceneRules: rules,
  });

  it("uses the fallback when nothing matches", () => {
    expect(
      resolveDestination(button([rule("hr", ">", 150, "worse")]), properties)
    ).toEqual({ sceneId: "fallback", ruleIndex: -1 });
  });

  it("goes where the matching rule says", () => {
    expect(
      resolveDestination(button([rule("hr", ">", 100, "worse")]), properties)
    ).toEqual({ sceneId: "worse", ruleIndex: 0 });
  });

  it("takes the first match, in order", () => {
    const rules = [
      rule("hr", ">", 200, "never"),
      rule("hr", ">", 100, "first"),
      rule("hr", ">", 50, "second"),
    ];
    expect(resolveDestination(button(rules), properties)).toEqual({
      sceneId: "first",
      ruleIndex: 1,
    });
  });

  it("skips a rule that can't be judged and carries on", () => {
    const rules = [
      rule("deleted", "=", 1, "never"),
      rule("hr", "=", 120, "ok"),
    ];
    expect(resolveDestination(button(rules), properties)).toEqual({
      sceneId: "ok",
      ruleIndex: 1,
    });
  });

  it("skips a rule with no scene", () => {
    const rules = [rule("hr", "=", 120, ""), rule("hr", "=", 120, "ok")];
    expect(resolveDestination(button(rules), properties).sceneId).toBe("ok");
  });

  it("leads nowhere when there are no rules and no fallback", () => {
    expect(
      resolveDestination({ id: "b", nextSceneRules: [] }, properties)
    ).toEqual({
      sceneId: undefined,
      ruleIndex: -1,
    });
  });

  it("works for buttons that have never had rules", () => {
    expect(
      resolveDestination({ id: "b", nextScene: "plain" }, properties)
    ).toEqual({ sceneId: "plain", ruleIndex: -1 });
    expect(resolveDestination(undefined, properties)).toEqual({
      sceneId: undefined,
      ruleIndex: -1,
    });
  });

  it("ignores rules that aren't a list", () => {
    expect(
      resolveDestination({ nextScene: "plain", nextSceneRules: "oops" }, [])
        .sceneId
    ).toBe("plain");
  });
});

describe("destinationSceneIds", () => {
  it("lists the fallback and every rule's scene once", () => {
    const component = {
      nextScene: "stable",
      nextSceneRules: [
        rule("hr", ">", 120, "worse"),
        rule("hr", ">", 150, "worse"),
        rule("hr", "<", 40, "stable"),
        rule("hr", "<", 20, ""),
      ],
    };
    expect(destinationSceneIds(component).sort()).toEqual(["stable", "worse"]);
  });

  it("is empty for a button that leads nowhere", () => {
    expect(destinationSceneIds({ id: "b" })).toEqual([]);
    expect(destinationSceneIds(undefined)).toEqual([]);
  });
});
