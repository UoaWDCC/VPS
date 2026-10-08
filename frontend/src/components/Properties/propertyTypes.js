export const propertyTypes = {
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
};

export const isBooleanPropertyType = (type) => type === propertyTypes.BOOLEAN;

export const getDefaultValue = (type) => {
  switch (type) {
    case propertyTypes.STRING:
      return "";
    case propertyTypes.NUMBER:
      return 0;
    case propertyTypes.BOOLEAN:
      return false;
    default:
      return "";
  }
};

export const operations = {
  SET: "set",
  ADD: "add",
  SUBTRACT: "subtract",
};

export const validOperations = {
  [propertyTypes.STRING]: [operations.SET],
  [propertyTypes.NUMBER]: [operations.SET, operations.ADD, operations.SUBTRACT],
  [propertyTypes.BOOLEAN]: [operations.SET],
};

export const validComparators = {
  [propertyTypes.STRING]: ["=", "!="],
  [propertyTypes.NUMBER]: ["=", "!=", ">", "<"],
  [propertyTypes.BOOLEAN]: ["=", "!="],
};
