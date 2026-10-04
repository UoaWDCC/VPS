import { describe, it, expect } from "@jest/globals";

import { resolveTrigger } from "../trigger.js";

const action = (id) => ({
  id,
  name: id,
  linkedScene: null,
  conditions: [],
  operations: [],
});

const scene = {
  actions: [
    action("action-1"),
    action("action-2"),
    action("action-3"),
    action("action-default"),
    action("action-timer"),
  ],
  components: [
    {
      id: "btn",
      clickable: true,
      linkedScene: "scene-click",
      actionRefs: [
        { id: "ref-action-3", actionId: "action-3", index: "a1" },
        { id: "ref-action-1", actionId: "action-1", index: "a0" },
      ],
    },
    {
      id: "label",
      clickable: false,
      actionRefs: [{ id: "ref-action-2", actionId: "action-2", index: "a0" }],
    },
  ],
  defaultActionRefs: [
    { id: "ref-action-default", actionId: "action-default", index: "a0" },
  ],
  defaultLinkedScene: "scene-default",
  timerActionRefs: [
    { id: "ref-action-timer", actionId: "action-timer", index: "a0" },
  ],
  timerLinkedScene: "scene-timer",
};

const ids = (resolved) => resolved.actions.map((a) => a.id);

describe("resolveTrigger", () => {
  it("resolves a clickable component's actions, ordered by index", () => {
    expect(ids(resolveTrigger(scene, "click", "btn"))).toEqual([
      "action-1",
      "action-3",
    ]);
  });

  it("uses the component's linkedScene as the click fallback", () => {
    expect(resolveTrigger(scene, "click", "btn").fallback).toBe("scene-click");
  });

  it("does not fall back to a scene-level link for a click trigger", () => {
    const unlinked = {
      ...scene,
      components: [{ id: "btn", clickable: true, actionRefs: [] }],
    };
    expect(resolveTrigger(unlinked, "click", "btn").fallback).toBeUndefined();
  });

  it("rejects a click trigger on a non-clickable component", () => {
    expect(() => resolveTrigger(scene, "click", "label")).toThrow();
  });

  it("rejects a click trigger with no componentId", () => {
    expect(() => resolveTrigger(scene, "click", null)).toThrow();
  });

  it("rejects a click trigger for a component that doesn't exist", () => {
    expect(() => resolveTrigger(scene, "click", "does-not-exist")).toThrow();
  });

  it("resolves default actions with defaultLinkedScene as the fallback", () => {
    const resolved = resolveTrigger(scene, "default", null);
    expect(ids(resolved)).toEqual(["action-default"]);
    expect(resolved.fallback).toBe("scene-default");
  });

  it("resolves timer actions with timerLinkedScene as the fallback", () => {
    const resolved = resolveTrigger(scene, "timer", null);
    expect(ids(resolved)).toEqual(["action-timer"]);
    expect(resolved.fallback).toBe("scene-timer");
  });

  it("resolves a fallback link with no actions", () => {
    const linkOnly = {
      ...scene,
      defaultActionRefs: [],
      timerActionRefs: undefined,
    };
    expect(resolveTrigger(linkOnly, "default", null)).toEqual({
      actions: [],
      fallback: "scene-default",
    });
    expect(resolveTrigger(linkOnly, "timer", null)).toEqual({
      actions: [],
      fallback: "scene-timer",
    });
  });

  it("drops refs to actions that no longer exist", () => {
    const dangling = {
      ...scene,
      defaultActionRefs: [
        { id: "ref-deleted-action", actionId: "deleted-action", index: "a0" },
        { id: "ref-action-default", actionId: "action-default", index: "a1" },
      ],
    };
    expect(ids(resolveTrigger(dangling, "default", null))).toEqual([
      "action-default",
    ]);
  });

  it("rejects an invalid trigger", () => {
    expect(() => resolveTrigger(scene, "bogus", null)).toThrow();
  });
});
