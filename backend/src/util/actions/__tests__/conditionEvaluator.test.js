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

  it("ignores conditions on a missing property, an invalid comparator, or a wrong-type value", () => {
    const failing = condition({ id: "c1", comparator: "=", value: 999 });
    const passing = condition({ id: "c1", comparator: "=", value: 5 });
    const stale = [
      condition({ id: "c2", stateVariableId: "does-not-exist" }),
      // "<" is only valid for number properties
      condition({
        id: "c3",
        stateVariableId: "bool",
        comparator: "<",
        value: false,
      }),
      // "!=" would otherwise always pass against a mismatched type
      condition({
        id: "c4",
        stateVariableId: "bool",
        comparator: "!=",
        value: 5,
      }),
    ];

    expect(evaluateConditions([passing, ...stale], properties)).toBe(true);
    expect(evaluateConditions([failing, ...stale], properties)).toBe(false);
  });

  it("returns true when every condition is stale", () => {
    const stale = [
      condition({ id: "c1", stateVariableId: "does-not-exist" }),
      condition({ id: "c2", stateVariableId: "str", value: 5 }),
    ];
    expect(evaluateConditions(stale, properties)).toBe(true);
  });
});
