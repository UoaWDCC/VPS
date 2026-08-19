import { operations, validOperations } from "./propertyTypes.js";

export const applyPropertyOperations = (properties, propertyOperations) => {
  const updatedProperties = [...properties];
  for (const propertyOperation of propertyOperations) {
    const property = updatedProperties.find(
      (property) => property.id === propertyOperation.stateVariableId
    );

    if (property) {
      if (
        !validOperations[property.type].includes(propertyOperation.operation)
      ) {
        console.error(
          `Invalid operation ${propertyOperation.operation} for property type ${property.type}`
        );
      }

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
          console.error(`Unknown operation ${propertyOperation.operation}`);
      }
    }
  }

  return updatedProperties;
};
