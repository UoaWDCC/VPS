import {
  isValidComparator,
  isValidValue,
} from "../properties/propertyTypes.js";

// evaluable when its property exists and its comparator and
// value are valid for the property's type
const isEvaluable = (condition, properties) => {
  const property = properties.find((p) => p.id === condition.stateVariableId);
  return (
    property !== undefined &&
    isValidComparator(property.type, condition.comparator) &&
    isValidValue(property.type, condition.value)
  );
};

export const evaluateCondition = (condition, properties) => {
  const property = properties.find(
    (property) => property.id === condition.stateVariableId
  );

  if (!property) return false;

  if (!isValidComparator(property.type, condition.comparator)) return false;

  const { comparator, value: expectedValue } = condition;
  const currentValue = property.value;

  switch (comparator) {
    case "=":
      return currentValue === expectedValue;
    case "!=":
      return currentValue !== expectedValue;
    case ">":
      return currentValue > expectedValue;
    case "<":
      return currentValue < expectedValue;
    default:
      return false;
  }
};

export const evaluateConditions = (conditions, properties) => {
  if (!conditions || conditions.length === 0) return true;
  return conditions
    .filter((condition) => isEvaluable(condition, properties))
    .every((condition) => evaluateCondition(condition, properties));
};
