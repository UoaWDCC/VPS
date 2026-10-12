import assert from "node:assert/strict";
import test from "node:test";

import { withoutProperty } from "./propertyReferences.js";

const deleted = { id: "hr", name: "heartRate" };

const op = (stateVariableId, extra = {}) => ({
  stateVariableId,
  operation: "add",
  value: 1,
  ...extra,
});
const binding = (stateVariableId) => ({ target: "width", stateVariableId });
const rule = (stateVariableId, sceneId = "s") => ({
  stateVariableId,
  comparator: ">",
  value: 1,
  sceneId,
});

test("takes out the operations, bindings and rules that use the property", () => {
  const result = withoutProperty(
    {
      id: "b",
      stateOperations: [op("hr"), op("fluids")],
      stateBindings: [binding("hr"), binding("fluids")],
      nextSceneRules: [rule("hr", "a"), rule("fluids", "b")],
    },
    deleted
  );
  assert.deepEqual(result.stateOperations, [op("fluids")]);
  assert.deepEqual(result.stateBindings, [binding("fluids")]);
  assert.deepEqual(result.nextSceneRules, [rule("fluids", "b")]);
});

test("leaves a button's own scene alone, so it becomes the only way on", () => {
  const result = withoutProperty(
    { id: "b", nextScene: "stable", nextSceneRules: [rule("hr")] },
    deleted
  );
  assert.equal(result.nextScene, "stable");
  assert.deepEqual(result.nextSceneRules, []);
});

test("matches operations from before properties had ids by name", () => {
  const result = withoutProperty(
    {
      id: "b",
      stateOperations: [
        { name: "heartRate", operation: "add", value: 1 },
        { name: "other", operation: "add", value: 1 },
      ],
    },
    deleted
  );
  assert.deepEqual(
    result.stateOperations.map((o) => o.name),
    ["other"]
  );
});

test("returns the same component when it has nothing to clean", () => {
  const plain = { id: "b", nextScene: "x" };
  assert.equal(withoutProperty(plain, deleted), plain);
});

test("doesn't change the component it was given", () => {
  const original = { id: "b", nextSceneRules: [rule("hr")] };
  withoutProperty(original, deleted);
  assert.equal(original.nextSceneRules.length, 1);
});
