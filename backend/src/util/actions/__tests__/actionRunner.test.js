import { describe, it, expect } from "@jest/globals";

import {
  orderedActionIds,
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

describe("orderedActionIds", () => {
  const ref = (id, actionId, index) => ({ id, actionId, index });

  it("orders by fractional index key, comparing by code unit", () => {
    const refs = [
      ref("r1", "third", "a1"),
      ref("r2", "second", "a0V"),
      ref("r3", "first", "Zz"),
      ref("r4", "zeroth", "A0"),
    ];
    // localeCompare would put "Zz" after "a1"
    expect(orderedActionIds(refs)).toEqual([
      "zeroth",
      "first",
      "second",
      "third",
    ]);
  });

  it("breaks index ties by ref id", () => {
    const refs = [ref("r2", "second", "a0"), ref("r1", "first", "a0")];
    expect(orderedActionIds(refs)).toEqual(["first", "second"]);
  });

  it("keeps duplicate references to the same action", () => {
    const refs = [ref("r1", "heal", "a0"), ref("r2", "heal", "a1")];
    expect(orderedActionIds(refs)).toEqual(["heal", "heal"]);
  });
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
  it("runs an action once per reference when it's referenced more than once", () => {
    const heal = action({
      id: "heal",
      operations: [
        { id: "op1", stateVariableId: "num", operation: "add", value: 1 },
      ],
    });
    const actions = resolveActions([heal], ["heal", "heal"]);

    const result = runActions(actions, numProperty());
    expect(result.properties.find((p) => p.id === "num").value).toBe(7);
  });

  it("skips stale operations and still applies the rest of the action", () => {
    const properties = [
      ...numProperty(),
      { id: "flag", type: "boolean", value: false },
    ];
    const mixed = action({
      id: "a1",
      operations: [
        // "add" isn't valid for a boolean property
        { id: "op1", stateVariableId: "flag", operation: "add", value: 1 },
        // wrong-type value for a boolean property
        { id: "op2", stateVariableId: "flag", operation: "set", value: 5 },
        { id: "op3", stateVariableId: "num", operation: "add", value: 1 },
      ],
      linkedScene: "scene-a",
    });

    const result = runActions([mixed], properties);
    expect(result.properties.find((p) => p.id === "flag").value).toBe(false);
    expect(result.properties.find((p) => p.id === "num").value).toBe(6);
    expect(result.linkedScene).toBe("scene-a");
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
        actionRefs: [
          { id: "ref-click-action", actionId: "click-action", index: "a0" },
        ],
      },
      {
        id: "label",
        clickable: false,
        actionRefs: [
          {
            id: "ref-non-clickable-action",
            actionId: "non-clickable-action",
            index: "a0",
          },
        ],
      },
    ],
    defaultActionRefs: [
      { id: "ref-default-action", actionId: "default-action", index: "a0" },
    ],
    timerActionRefs: [
      { id: "ref-timer-action", actionId: "timer-action", index: "a0" },
    ],
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
          actionRefs: [
            { id: "ref-no-op-action", actionId: "no-op-action", index: "a0" },
          ],
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
          actionRefs: [
            { id: "ref-click-action", actionId: "click-action", index: "a0" },
          ],
        },
        {
          id: "btn2",
          clickable: true,
          actionRefs: [
            { id: "ref-click-action", actionId: "click-action", index: "a0" },
          ],
        },
      ],
      defaultActionRefs: [],
      timerActionRefs: [],
    };
    expect(getLinkedSceneIds(dupeScene)).toEqual(["scene-click"]);
  });

  it("includes the default and timer direct links", () => {
    const linkOnlyScene = {
      actions: [],
      components: [],
      defaultActionRefs: [],
      timerActionRefs: [],
      defaultLinkedScene: "scene-default-direct",
      timerLinkedScene: "scene-timer-direct",
    };
    expect(new Set(getLinkedSceneIds(linkOnlyScene))).toEqual(
      new Set(["scene-default-direct", "scene-timer-direct"])
    );
  });

  it("includes clickable components' direct links but not non-clickable ones", () => {
    const componentLinkScene = {
      actions: [],
      components: [
        {
          id: "btn",
          clickable: true,
          actionRefs: [],
          linkedScene: "scene-btn-direct",
        },
        {
          id: "label",
          clickable: false,
          actionRefs: [],
          linkedScene: "scene-label-direct",
        },
      ],
      defaultActionRefs: [],
      timerActionRefs: [],
    };
    expect(getLinkedSceneIds(componentLinkScene)).toEqual(["scene-btn-direct"]);
  });

  it("stringifies ObjectId direct links and dedupes them against action links", () => {
    const objectIdLike = { toString: () => "scene-default" };
    const mixedScene = {
      ...scene,
      defaultLinkedScene: objectIdLike,
      timerLinkedScene: null,
    };
    const linked = getLinkedSceneIds(mixedScene);
    expect(linked.filter((id) => id === "scene-default")).toHaveLength(1);
    expect(linked).not.toContain(null);
  });
});
