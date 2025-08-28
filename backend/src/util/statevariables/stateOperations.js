import { HttpError } from "../error.js";
import { operations, validOperations } from "./stateTypes.js";
import STATUS from "../status.js";

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
        throw new HttpError(
          `Invalid operation ${stateOperation.operation} for state variable type ${stateVariable.type}`,
          STATUS.BAD_REQUEST
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
          throw new HttpError(
            `Unknown operation ${stateOperation.operation}`,
            STATUS.BAD_REQUEST
          );
      }
    }
  }

  return updatedStateVariables;
};
