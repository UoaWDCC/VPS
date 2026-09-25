import { describe, it, expect } from "@jest/globals";

import {
  resolveActions,
  runActions,
  getLinkedSceneIds,
} from "../actionRunner.js";

const numProperty = () => [{ id: "num", type: "number", value: 5 }];

const action = (overrides) => ({
  id: "action-1",
  name: "Action",
  linkedScene: null,
  conditions: [],
  operations: [],
  ...overrides,
});

describe("resolveActions", () => {
  const sceneActions = [
    action({ id: "a1", name: "First" }),
    action({ id: "a2", name: "Second" }),
    action({ id: "a3", name: "Third" }),
  ];

  it("preserves the order given by actionIds", () => {
    const resolved = resolveActions(sceneActions, ["a3", "a1"]);
    expect(resolved.map((a) => a.id)).toEqual(["a3", "a1"]);
  });

  it("silently drops unknown action ids", () => {
    const resolved = resolveActions(sceneActions, ["a1", "missing", "a2"]);
    expect(resolved.map((a) => a.id)).toEqual(["a1", "a2"]);
  });

  it("returns an empty array for an empty or missing id list", () => {
    expect(resolveActions(sceneActions, [])).toEqual([]);
    expect(resolveActions(sceneActions, undefined)).toEqual([]);
  });
});

describe("runActions", () => {
  it("is a no-op for an empty action list", () => {
    const properties = numProperty();
    const result = runActions([], properties);
    expect(result).toEqual({ properties, linkedScene: null, changed: false });
  });

  it("skips an action whose conditions fail (fallthrough) and continues the loop", () => {
    const failing = action({
      id: "a1",
      conditions: [
        { id: "c1", stateVariableId: "num", comparator: "=", value: 999 },
      ],
      linkedScene: "scene-a",
    });
    const passing = action({
      id: "a2",
      conditions: [],
      linkedScene: "scene-b",
    });

    const result = runActions([failing, passing], numProperty());
    expect(result.linkedScene).toBe("scene-b");
  });

  it("requires all conditions to pass (AND semantics)", () => {
    const partiallyMatching = action({
      id: "a1",
      conditions: [
        { id: "c1", stateVariableId: "num", comparator: "=", value: 5 },
        { id: "c2", stateVariableId: "num", comparator: "=", value: 999 },
      ],
      linkedScene: "scene-a",
    });

    const result = runActions([partiallyMatching], numProperty());
    expect(result.linkedScene).toBeNull();
  });

  it("applies operations on a passing non-navigating action and continues the loop", () => {
    const mutating = action({
      id: "a1",
      operations: [
        { id: "op1", stateVariableId: "num", operation: "add", value: 1 },
      ],
      linkedScene: null,
    });
    const navigating = action({
      id: "a2",
      linkedScene: "scene-b",
    });

    const result = runActions([mutating, navigating], numProperty());
    expect(result.properties.find((p) => p.id === "num").value).toBe(6);
    expect(result.linkedScene).toBe("scene-b");
    expect(result.changed).toBe(true);
  });

  it("stages later conditions against properties mutated earlier in the same run", () => {
    const mutating = action({
      id: "a1",
      operations: [
        { id: "op1", stateVariableId: "num", operation: "add", value: 1 },
      ],
    });
    const dependsOnStagedValue = action({
      id: "a2",
      conditions: [
        { id: "c1", stateVariableId: "num", comparator: "=", value: 6 },
      ],
      linkedScene: "scene-b",
    });

    const result = runActions([mutating, dependsOnStagedValue], numProperty());
    expect(result.linkedScene).toBe("scene-b");
  });

  it("stops at the first action that both passes and has a linkedScene", () => {
    const first = action({ id: "a1", linkedScene: "scene-a" });
    const second = action({
      id: "a2",
      operations: [
        { id: "op1", stateVariableId: "num", operation: "add", value: 1 },
      ],
      linkedScene: "scene-b",
    });

    const result = runActions([first, second], numProperty());
    expect(result.linkedScene).toBe("scene-a");
    // second action never ran, so its operation shouldn't have applied
    expect(result.properties.find((p) => p.id === "num").value).toBe(5);
  });

  it("persists staged properties (changed: true) even when nothing navigates", () => {
    const mutating = action({
      id: "a1",
      operations: [
        { id: "op1", stateVariableId: "num", operation: "add", value: 1 },
      ],
      linkedScene: null,
    });

    const result = runActions([mutating], numProperty());
    expect(result.changed).toBe(true);
    expect(result.linkedScene).toBeNull();
    expect(result.properties.find((p) => p.id === "num").value).toBe(6);
  });
});

describe("getLinkedSceneIds", () => {
  const sceneActions = [
    action({ id: "click-action", linkedScene: "scene-click" }),
    action({ id: "default-action", linkedScene: "scene-default" }),
    action({ id: "timer-action", linkedScene: "scene-timer" }),
    action({ id: "non-clickable-action", linkedScene: "scene-hidden" }),
    action({ id: "no-op-action", linkedScene: null }),
  ];

  const scene = {
    actions: sceneActions,
    components: [
      {
        id: "btn",
        clickable: true,
        actionRefs: [{ index: 0, id: "click-action" }],
      },
      {
        id: "label",
        clickable: false,
        actionRefs: [{ index: 0, id: "non-clickable-action" }],
      },
    ],
    defaultActionRefs: [{ index: 0, id: "default-action" }],
    timerActionRefs: [{ index: 0, id: "timer-action" }],
  };

  it("unions linkedScene targets across clickable components, defaults, and timer actions", () => {
    expect(new Set(getLinkedSceneIds(scene))).toEqual(
      new Set(["scene-click", "scene-default", "scene-timer"])
    );
  });

  it("excludes actions from non-clickable components", () => {
    expect(getLinkedSceneIds(scene)).not.toContain("scene-hidden");
  });

  it("excludes actions with no linkedScene", () => {
    const sceneWithNoOp = {
      ...scene,
      components: [
        {
          id: "btn",
          clickable: true,
          actionRefs: [{ index: 0, id: "no-op-action" }],
        },
      ],
      defaultActionRefs: [],
      timerActionRefs: [],
    };
    expect(getLinkedSceneIds(sceneWithNoOp)).toEqual([]);
  });

  it("dedupes repeated targets", () => {
    const dupeScene = {
      actions: sceneActions,
      components: [
        {
          id: "btn1",
          clickable: true,
          actionRefs: [{ index: 0, id: "click-action" }],
        },
        {
          id: "btn2",
          clickable: true,
          actionRefs: [{ index: 0, id: "click-action" }],
        },
      ],
      defaultActionRefs: [],
      timerActionRefs: [],
    };
    expect(getLinkedSceneIds(dupeScene)).toEqual(["scene-click"]);
  });
});
