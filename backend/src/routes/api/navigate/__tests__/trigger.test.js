import { describe, it, expect } from "@jest/globals";

import { resolveTriggerActionIds } from "../trigger.js";

const scene = {
  components: [
    {
      id: "btn",
      clickable: true,
      actionRefs: [{ index: 0, id: "action-1" }],
    },
    {
      id: "label",
      clickable: false,
      actionRefs: [{ index: 0, id: "action-2" }],
    },
  ],
  defaultActionRefs: [{ index: 0, id: "action-default" }],
  timerActionRefs: [{ index: 0, id: "action-timer" }],
};

describe("resolveTriggerActionIds", () => {
  it("resolves a clickable component's actionRefs, ordered by index", () => {
    expect(resolveTriggerActionIds(scene, "click", "btn")).toEqual([
      "action-1",
    ]);
  });

  it("rejects a click trigger on a non-clickable component", () => {
    expect(() => resolveTriggerActionIds(scene, "click", "label")).toThrow();
  });

  it("rejects a click trigger with no componentId", () => {
    expect(() => resolveTriggerActionIds(scene, "click", null)).toThrow();
  });

  it("rejects a click trigger for a component that doesn't exist", () => {
    expect(() =>
      resolveTriggerActionIds(scene, "click", "does-not-exist")
    ).toThrow();
  });

  it("resolves defaultActionRefs for the default trigger", () => {
    expect(resolveTriggerActionIds(scene, "default", null)).toEqual([
      "action-default",
    ]);
  });

  it("resolves timerActionRefs for the timer trigger", () => {
    expect(resolveTriggerActionIds(scene, "timer", null)).toEqual([
      "action-timer",
    ]);
  });

  it("rejects an invalid trigger", () => {
    expect(() => resolveTriggerActionIds(scene, "bogus", null)).toThrow();
  });
});
