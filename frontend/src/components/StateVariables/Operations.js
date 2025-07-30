import { StateTypes } from "./StateTypes";

export const operations = {
  SET: "set",
  ADD: "add",
};

export const validOperations = {
  [StateTypes.STRING]: [operations.SET],
  [StateTypes.NUMBER]: [operations.SET, operations.ADD],
  [StateTypes.BOOLEAN]: [operations.SET],
};
