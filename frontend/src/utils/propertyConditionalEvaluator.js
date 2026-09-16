/**
 * Evaluates a single property conditional against current properties
 * @param {Object} conditional - The property conditional to evaluate
 * @param {Array} properties - Current properties with their values
 * @returns {boolean} - Whether the condition is met
 */
function evaluatePropertyConditional(conditional, properties) {
  if (!conditional || !properties) {
    return true; // If no conditional or properties, show the resource
  }

  // Find the property for this conditional
  const property = properties.find(
    (sv) => sv.id === conditional.stateVariableId
  );

  if (!property) {
    return false; // If property doesn't exist, hide the resource
  }

  const { comparator, value: expectedValue } = conditional;
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
}

/**
 * Evaluates all property conditionals for a resource (logical AND)
 * @param {Array} stateConditionals - Array of property conditionals to evaluate
 * @param {Array} properties - Current properties with their values
 * @returns {boolean} - Whether ALL conditionals are met (true if no conditionals)
 */
export function evaluateResourceConditions(stateConditionals, properties) {
  // If no property conditionals, show the resource
  if (!stateConditionals || stateConditionals.length === 0) {
    return true;
  }

  // All conditionals must evaluate to true (logical AND)
  return stateConditionals.every((conditional) =>
    evaluatePropertyConditional(conditional, properties)
  );
}

/**
 * Filters resources based on their property conditionals
 * @param {Array} resources - Resources to filter
 * @param {Array} properties - Current properties with their values
 * @returns {Array} - Filtered resources that meet their conditions
 */
export function filterResourcesByConditions(resources, properties) {
  if (!resources) return [];

  return resources.filter((resource) =>
    evaluateResourceConditions(resource.stateConditionals, properties)
  );
}

/**
 * Filters tree structure based on property conditionals
 * @param {Array} tree - Tree structure with groups containing files
 * @param {Array} properties - Current properties with their values
 * @returns {Array} - Filtered tree with only visible files and non-empty groups
 */
export function filterTreeByConditions(tree, properties) {
  if (!tree) return [];

  return tree
    .filter(({ stateConditionals }) =>
      evaluateResourceConditions(stateConditionals, properties)
    )
    .map((r) =>
      r.type === "collection"
        ? {
            ...r,
            children: filterResourcesByConditions(r.children, properties),
          }
        : r
    )
    .filter((r) => r.type !== "collection" || r.children?.length > 0);
}
