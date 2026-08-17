import assert from "node:assert/strict";
import test from "node:test";

import { isBooleanStateType, stateTypes } from "./stateTypes.js";

test("changing to boolean selects the boolean value control", () => {
  let selectedType = stateTypes.STRING;

  selectedType = stateTypes.BOOLEAN;

  assert.equal(isBooleanStateType(selectedType), true);
});

test("changing away from boolean selects the standard value control", () => {
  let selectedType = stateTypes.BOOLEAN;

  selectedType = stateTypes.NUMBER;

  assert.equal(isBooleanStateType(selectedType), false);
});
