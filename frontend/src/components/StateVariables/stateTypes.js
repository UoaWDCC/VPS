export const stateTypes = {
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
};

export const getDefaultValue = (type) => {
  switch (type) {
    case stateTypes.STRING:
      return "";
    case stateTypes.NUMBER:
      return 0;
    case stateTypes.BOOLEAN:
      return false;
    default:
      return "";
  }
};

export const operations = {
  SET: "set",
  ADD: "add",
};

export const validOperations = {
  [stateTypes.STRING]: [operations.SET],
  [stateTypes.NUMBER]: [operations.SET, operations.ADD],
  [stateTypes.BOOLEAN]: [operations.SET],
};

export const validComparators = {
  [stateTypes.STRING]: ["=", "!="],
  [stateTypes.NUMBER]: ["=", "!=", ">", "<"],
  [stateTypes.BOOLEAN]: ["=", "!="],
};
