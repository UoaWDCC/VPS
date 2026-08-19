import { HttpError } from "../error.js";
import { operations, validOperations } from "./propertyTypes.js";
import STATUS from "../status.js";

export const applyPropertyOperations = (properties, propertyOperations) => {
  const updatedProperties = [...properties];
  for (const propertyOperation of propertyOperations) {
    const property = updatedProperties.find(
      (property) => property.id === propertyOperation.stateVariableId
    );

    if (property) {
      // Verify if the operation is valid for the property type
      if (
        !validOperations[property.type].includes(propertyOperation.operation)
      ) {
        throw new HttpError(
          `Invalid operation ${propertyOperation.operation} for property type ${property.type}`,
          STATUS.BAD_REQUEST
        );
      }

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
