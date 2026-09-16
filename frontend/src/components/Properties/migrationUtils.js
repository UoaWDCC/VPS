import { v4 as uuidv4 } from "uuid";

/**
 * Ensures that all properties have UUIDs for backward compatibility
 * @param {Array} properties - Array of properties
 * @returns {Array} Array of properties with UUIDs
 */
export const ensurePropertyUUIDs = (properties) => {
  if (!properties) return [];

  return properties.map((property) => {
    if (!property.id) {
      return {
        ...property,
        id: uuidv4(),
      };
    }
    return property;
  });
};

/**
 * Migrates property operations to use UUIDs instead of names
 * @param {Array} propertyOperations - Array of property operations
 * @param {Array} properties - Array of properties with UUIDs
 * @returns {Array} Array of migrated property operations
 */
export const migratePropertyOperations = (propertyOperations, properties) => {
  if (!propertyOperations || !properties) return propertyOperations || [];

  return propertyOperations.map((operation) => {
    if (operation.stateVariableId) {
      return operation;
    }

    const property = properties.find(
      (property) => property.name === operation.name
    );

    if (property) {
      return {
        ...operation,
        stateVariableId: property.id,
        displayName: operation.name,
        name: undefined,
      };
    }

    return operation;
  });
};
