import assert from "node:assert/strict";
import test from "node:test";

import { isBooleanPropertyType, propertyTypes } from "./propertyTypes.js";

test("changing to boolean selects the boolean value control", () => {
  let selectedType = propertyTypes.STRING;

  selectedType = propertyTypes.BOOLEAN;

  assert.equal(isBooleanPropertyType(selectedType), true);
});

test("changing away from boolean selects the standard value control", () => {
  let selectedType = propertyTypes.BOOLEAN;

  selectedType = propertyTypes.NUMBER;

  assert.equal(isBooleanPropertyType(selectedType), false);
});
