import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  COMPARATORS,
  destinationSceneIds,
  resolveDestination,
  ruleMatches,
} from "./destination.js";

// The server decides where a player goes and the play page predicts it, so the
// two copies of the rules must be the same file. (The full set of cases is in
// the backend's tests; this keeps the copies from drifting apart.)
test("matches the backend's copy word for word", (t) => {
  const backendCopy = new URL(
    "../../../../backend/src/util/properties/destination.js",
    import.meta.url
  );
  if (!existsSync(backendCopy)) {
    t.skip("the backend isn't checked out next to the frontend");
    return;
  }
  assert.equal(
    readFileSync(new URL("./destination.js", import.meta.url), "utf8"),
    readFileSync(backendCopy, "utf8")
  );
});

const properties = [
  { id: "hr", name: "heartRate", type: "number", value: 130 },
  { id: "fluids", name: "fluidsGiven", type: "boolean", value: false },
];

test("offers the four comparators", () => {
  assert.deepEqual(COMPARATORS, ["=", "!=", ">", "<"]);
});

test("a rule matches on the current value of its property", () => {
  const over120 = {
    stateVariableId: "hr",
    comparator: ">",
    value: 120,
    sceneId: "worse",
  };
  assert.equal(ruleMatches(over120, properties), true);
  assert.equal(ruleMatches(over120, [{ ...properties[0], value: 100 }]), false);
});

test("a button goes where its first matching rule says, else to its own scene", () => {
  const button = {
    nextScene: "stable",
    nextSceneRules: [
      { stateVariableId: "fluids", comparator: "=", value: true, sceneId: "a" },
      { stateVariableId: "hr", comparator: ">", value: 120, sceneId: "b" },
    ],
  };
  assert.deepEqual(resolveDestination(button, properties), {
    sceneId: "b",
    ruleIndex: 1,
  });
  assert.deepEqual(
    resolveDestination(button, [{ ...properties[0], value: 90 }]),
    { sceneId: "stable", ruleIndex: -1 }
  );
});

test("lists every scene a button can lead to", () => {
  assert.deepEqual(
    destinationSceneIds({
      nextScene: "stable",
      nextSceneRules: [{ sceneId: "worse" }, { sceneId: "stable" }],
    }).sort(),
    ["stable", "worse"]
  );
});
