import { HttpError } from "../error.js";
import { operations, isValidOperation, isValidValue } from "./propertyTypes.js";
import STATUS from "../status.js";

export const applyPropertyOperations = (properties, propertyOperations) => {
  const updatedProperties = [...properties];
  for (const propertyOperation of propertyOperations) {
    const property = updatedProperties.find(
      (property) => property.id === propertyOperation.stateVariableId
    );

    if (property) {
      // skip operations left stale by the property changing type
      if (
        !isValidOperation(property.type, propertyOperation.operation) ||
        !isValidValue(property.type, propertyOperation.value)
      )
        continue;

      // Apply the operation to the property
      switch (propertyOperation.operation) {
        case operations.SET:
          property.value = propertyOperation.value;
          break;
        case operations.ADD:
          property.value += propertyOperation.value;
          break;
        case operations.SUBTRACT:
          property.value -= propertyOperation.value;
          break;
        default:
          throw new HttpError(
            `Unknown operation ${propertyOperation.operation}`,
            STATUS.BAD_REQUEST
          );
      }
    }
  }

  return updatedProperties;
};
