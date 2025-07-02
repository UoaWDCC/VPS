export const StateTypes = {
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
};

export const getDefaultValue = (type) => {
  switch (type) {
    case StateTypes.STRING:
      return "";
    case StateTypes.NUMBER:
      return 0;
    case StateTypes.BOOLEAN:
      return false;
    default:
      return "";
  }
};
