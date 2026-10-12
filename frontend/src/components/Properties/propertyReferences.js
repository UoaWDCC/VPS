/**
 * A component without anything that refers to a deleted property: the
 * property operations it makes, the bindings that follow it, and the
 * destination rules that test it. Operations from before properties had ids
 * are matched by name. A component that has none of those is returned as is.
 *
 * @param {object} component
 * @param {{ id: string, name: string }} property the property being deleted
 */
export function withoutProperty(component, property) {
  const operations = component.stateOperations?.filter(
    (operation) =>
      !(
        (operation.stateVariableId &&
          operation.stateVariableId === property.id) ||
        (!operation.stateVariableId && operation.name === property.name)
      )
  );
  const bindings = component.stateBindings?.filter(
    (binding) => binding.stateVariableId !== property.id
  );
  const rules = component.nextSceneRules?.filter(
    (rule) => rule.stateVariableId !== property.id
  );

  if (!operations && !bindings && !rules) return component;

  return {
    ...component,
    ...(operations && { stateOperations: operations }),
    ...(bindings && { stateBindings: bindings }),
    ...(rules && { nextSceneRules: rules }),
  };
}
