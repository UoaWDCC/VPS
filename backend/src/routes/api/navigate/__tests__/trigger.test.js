import { describe, it, expect } from "@jest/globals";

import { resolveTriggerActionIds } from "../trigger.js";

const scene = {
  components: [
    { id: "btn", clickable: true, actions: ["action-1"] },
    { id: "label", clickable: false, actions: ["action-2"] },
  ],
  defaultActionIds: ["action-default"],
  timerActionIds: ["action-timer"],
};

describe("resolveTriggerActionIds", () => {
  it("resolves a clickable component's actions", () => {
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

  it("resolves defaultActionIds for the default trigger", () => {
    expect(resolveTriggerActionIds(scene, "default", null)).toEqual([
      "action-default",
    ]);
  });

  it("resolves timerActionIds for the timer trigger", () => {
    expect(resolveTriggerActionIds(scene, "timer", null)).toEqual([
      "action-timer",
    ]);
  });

  it("rejects an invalid trigger", () => {
    expect(() => resolveTriggerActionIds(scene, "bogus", null)).toThrow();
  });
});
