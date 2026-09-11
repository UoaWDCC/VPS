import { isValidComparator } from "../properties/propertyTypes.js";

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
  return conditions.every((condition) =>
    evaluateCondition(condition, properties)
  );
};
