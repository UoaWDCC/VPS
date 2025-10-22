import { stateTypes } from "../components/StateVariables/stateTypes";

/**
 * Evaluates a single state conditional against current state variables
 * @param {Object} conditional - The state conditional to evaluate
 * @param {Array} stateVariables - Current state variables with their values
 * @returns {boolean} - Whether the condition is met
 */
function evaluateStateConditional(conditional, stateVariables) {
  if (!conditional || !stateVariables) {
    return true; // If no conditional or state variables, show the resource
  }

  // Find the state variable for this conditional
  const stateVariable = stateVariables.find(
    (sv) => sv.id === conditional.stateVariableId
  );

  if (!stateVariable) {
    return false; // If state variable doesn't exist, hide the resource
  }

  const { comparator, value: expectedValue } = conditional;
  const currentValue = stateVariable.value;

  // Handle different comparison types based on state variable type
  switch (stateVariable.type) {
    case stateTypes.BOOLEAN: {
      const boolExpected = expectedValue === "true";
      const boolCurrent = currentValue === "true";

      switch (comparator) {
        case "=":
          return boolCurrent === boolExpected;
        case "!=":
          return boolCurrent !== boolExpected;
        default:
          return false;
      }
    }

    case stateTypes.NUMBER: {
      const numExpected = parseFloat(expectedValue);
      const numCurrent = parseFloat(currentValue);

      if (isNaN(numExpected) || isNaN(numCurrent)) {
        return false;
      }

      switch (comparator) {
        case "=":
          return numCurrent === numExpected;
        case "!=":
          return numCurrent !== numExpected;
        case ">":
          return numCurrent > numExpected;
        case "<":
          return numCurrent < numExpected;
        default:
          return false;
      }
    }

    case stateTypes.STRING: {
      const strExpected = String(expectedValue);
      const strCurrent = String(currentValue);

      switch (comparator) {
        case "=":
          return strCurrent === strExpected;
        case "!=":
          return strCurrent !== strExpected;
        default:
          return false;
      }
    }

    default:
      return false;
  }
}

/**
 * Evaluates all state conditionals for a resource (logical AND)
 * @param {Array} stateConditionals - Array of state conditionals to evaluate
 * @param {Array} stateVariables - Current state variables with their values
 * @returns {boolean} - Whether ALL conditionals are met (true if no conditionals)
 */
export function evaluateResourceConditions(stateConditionals, stateVariables) {
  // If no state conditionals, show the resource
  if (!stateConditionals || stateConditionals.length === 0) {
    return true;
  }

  // All conditionals must evaluate to true (logical AND)
  return stateConditionals.every((conditional) =>
    evaluateStateConditional(conditional, stateVariables)
  );
}

/**
 * Filters resources based on their state conditionals
 * @param {Array} resources - Resources to filter
 * @param {Array} stateVariables - Current state variables with their values
 * @returns {Array} - Filtered resources that meet their conditions
 */
export function filterResourcesByConditions(resources, stateVariables) {
  if (!resources) return [];

  return resources.filter((resource) =>
    evaluateResourceConditions(resource.stateConditionals, stateVariables)
  );
}

/**
 * Filters tree structure based on state conditionals
 * @param {Array} tree - Tree structure with groups containing files
 * @param {Array} stateVariables - Current state variables with their values
 * @returns {Array} - Filtered tree with only visible files and non-empty groups
 */
export function filterTreeByConditions(tree, stateVariables) {
  if (!tree) return [];

  return tree
    .map((group) => ({
      ...group,
      files: filterResourcesByConditions(group.files, stateVariables),
    }))
    .filter((group) => group.files && group.files.length > 0);
}
