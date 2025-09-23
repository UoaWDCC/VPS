import { operations, validOperations } from "./stateTypes.js";

export const applyStateOperations = (stateVariables, stateOperations) => {
  const updatedStateVariables = [...stateVariables];
  for (const stateOperation of stateOperations) {
    const stateVariable = updatedStateVariables.find(
      (stateVariable) => stateVariable.id === stateOperation.stateVariableId
    );

    if (stateVariable) {
      // Verify if the operation is valid for the state variable type
      if (
        !validOperations[stateVariable.type].includes(stateOperation.operation)
      ) {
        console.error(
          `Invalid operation ${stateOperation.operation} for state variable type ${stateVariable.type}`
        );
      }

      // Apply the operation to the state variable
      switch (stateOperation.operation) {
        case operations.SET:
          stateVariable.value = stateOperation.value;
          break;
        case operations.ADD:
          stateVariable.value += stateOperation.value;
          break;
        default:
          console.error(`Unknown operation ${stateOperation.operation}`);
      }
    }
  }

  return updatedStateVariables;
};
