import assert from "node:assert/strict";
import test from "node:test";

import { describeCondition, describeDecision } from "./describe.js";

const properties = [
  { id: "hr", name: "heartRate", type: "number", value: 135 },
  { id: "note", name: "note", type: "string", value: "ok" },
];

const rules = [
  { stateVariableId: "note", comparator: "=", value: "bad", sceneId: "a" },
  { stateVariableId: "hr", comparator: ">", value: 120, sceneId: "worse" },
];
const names = { worse: "Deteriorates", stable: "Stable" };
const sceneName = (id) => names[id] ?? "a scene";

test("describes a condition in words", () => {
  assert.equal(describeCondition(rules[1], properties), "heartRate > 120");
  assert.equal(describeCondition(rules[0], properties), 'note = "bad"');
});

test("marks a condition on a deleted property", () => {
  assert.equal(
    describeCondition({ ...rules[1], stateVariableId: "gone" }, properties),
    "a deleted property > 120"
  );
});

test("says which rule sent the player, and what it saw", () => {
  const lines = describeDecision(
    { nextScene: "stable", nextSceneRules: rules },
    properties,
    1,
    sceneName
  );
  assert.deepEqual(lines, [
    "Rule 2 matched: heartRate > 120 (it is 135)",
    "So it goes to Deteriorates",
  ]);
});

test("says when the button's own scene was used", () => {
  const lines = describeDecision(
    { nextScene: "stable", nextSceneRules: rules },
    properties,
    -1,
    sceneName
  );
  assert.deepEqual(lines, [
    "No rule matched",
    "So it goes to Stable, its own scene",
  ]);
});

test("says when the player stays put", () => {
  const lines = describeDecision(
    { nextSceneRules: rules },
    properties,
    -1,
    () => "x"
  );
  assert.match(lines[1], /the player stays here/);
});

test("has nothing to say about a button without rules", () => {
  assert.deepEqual(
    describeDecision({ nextScene: "stable" }, properties, -1, sceneName),
    []
  );
});
