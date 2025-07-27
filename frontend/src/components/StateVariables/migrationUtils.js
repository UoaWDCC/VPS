import { v4 as uuidv4 } from 'uuid';

/**
 * Ensures that all state variables have UUIDs for backward compatibility
 * @param {Array} stateVariables - Array of state variables
 * @returns {Array} Array of state variables with UUIDs
 */
export const ensureStateVariableUUIDs = (stateVariables) => {
  if (!stateVariables) return [];
  
  return stateVariables.map(variable => {
    // If the variable doesn't have an ID, generate one
    if (!variable.id) {
      return {
        ...variable,
        id: uuidv4()
      };
    }
    return variable;
  });
};

/**
 * Migrates state operations to use UUIDs instead of names
 * @param {Array} stateOperations - Array of state operations
 * @param {Array} stateVariables - Array of state variables with UUIDs
 * @returns {Array} Array of migrated state operations
 */
export const migrateStateOperations = (stateOperations, stateVariables) => {
  if (!stateOperations || !stateVariables) return stateOperations || [];
  
  return stateOperations.map(operation => {
    // If operation already has stateVariableId, it's already migrated
    if (operation.stateVariableId) {
      return operation;
    }
    
    // Find the state variable by name and get its ID
    const stateVariable = stateVariables.find(variable => variable.name === operation.name);
    
    if (stateVariable) {
      return {
        ...operation,
        stateVariableId: stateVariable.id,
        displayName: operation.name, // Preserve original name for display
        // Remove the old name property to avoid confusion
        name: undefined
      };
    }
    
    // If we can't find the state variable, keep the operation as-is for now
    return operation;
  });
};
