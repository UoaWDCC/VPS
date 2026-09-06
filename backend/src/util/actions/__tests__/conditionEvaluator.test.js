import { describe, it, expect } from "@jest/globals";

import {
  evaluateCondition,
  evaluateConditions,
} from "../conditionEvaluator.js";

const numberProp = { id: "num", type: "number", value: 5 };
const stringProp = { id: "str", type: "string", value: "hello" };
const boolProp = { id: "bool", type: "boolean", value: true };
const properties = [numberProp, stringProp, boolProp];

const condition = (overrides) => ({
  id: "cond-1",
  stateVariableId: "num",
  comparator: "=",
  value: 5,
  ...overrides,
});

describe("evaluateCondition", () => {
  it("evaluates '=' correctly", () => {
    expect(
      evaluateCondition(condition({ comparator: "=", value: 5 }), properties)
    ).toBe(true);
    expect(
      evaluateCondition(condition({ comparator: "=", value: 6 }), properties)
    ).toBe(false);
  });

  it("evaluates '!=' correctly", () => {
    expect(
      evaluateCondition(condition({ comparator: "!=", value: 6 }), properties)
    ).toBe(true);
    expect(
      evaluateCondition(condition({ comparator: "!=", value: 5 }), properties)
    ).toBe(false);
  });

  it("evaluates '<' correctly", () => {
    expect(
      evaluateCondition(condition({ comparator: "<", value: 6 }), properties)
    ).toBe(true);
    expect(
      evaluateCondition(condition({ comparator: "<", value: 5 }), properties)
    ).toBe(false);
  });

  it("evaluates '>' correctly", () => {
    expect(
      evaluateCondition(condition({ comparator: ">", value: 4 }), properties)
    ).toBe(true);
    expect(
      evaluateCondition(condition({ comparator: ">", value: 5 }), properties)
    ).toBe(false);
  });

  it("returns false when the referenced property doesn't exist", () => {
    const missing = condition({ stateVariableId: "does-not-exist" });
    expect(evaluateCondition(missing, properties)).toBe(false);
  });

  it("returns false when the comparator isn't valid for the property's type", () => {
    // "<" is only valid for number properties, not boolean ones
    const invalid = condition({
      stateVariableId: "bool",
      comparator: "<",
      value: false,
    });
    expect(evaluateCondition(invalid, properties)).toBe(false);
  });

  it("evaluates string equality correctly", () => {
    const eq = condition({
      stateVariableId: "str",
      comparator: "=",
      value: "hello",
    });
    const neq = condition({
      stateVariableId: "str",
      comparator: "!=",
      value: "world",
    });
    expect(evaluateCondition(eq, properties)).toBe(true);
    expect(evaluateCondition(neq, properties)).toBe(true);
  });
});

describe("evaluateConditions", () => {
  it("returns true when the conditions list is empty or missing", () => {
    expect(evaluateConditions([], properties)).toBe(true);
    expect(evaluateConditions(undefined, properties)).toBe(true);
  });

  it("ANDs multiple conditions: true only when all pass", () => {
    const allPass = [
      condition({
        id: "c1",
        stateVariableId: "num",
        comparator: "=",
        value: 5,
      }),
      condition({
        id: "c2",
        stateVariableId: "str",
        comparator: "=",
        value: "hello",
      }),
    ];
    expect(evaluateConditions(allPass, properties)).toBe(true);

    const onePasses = [
      condition({
        id: "c1",
        stateVariableId: "num",
        comparator: "=",
        value: 5,
      }),
      condition({
        id: "c2",
        stateVariableId: "str",
        comparator: "=",
        value: "nope",
      }),
    ];
    expect(evaluateConditions(onePasses, properties)).toBe(false);
  });
});
