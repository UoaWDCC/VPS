import { HttpError } from "../../../util/error.js";
import STATUS from "../../../util/status.js";

// Resolves the ordered action-id list for the given trigger
export const resolveTriggerActionIds = (scene, trigger, componentId) => {
  switch (trigger) {
    case "click": {
      if (!componentId)
        throw new HttpError(
          "componentId is required for click trigger",
          STATUS.BAD_REQUEST
        );
      const component = scene.components.find((c) => c.id === componentId);
      if (!component) {
        throw new HttpError("Component does not exist", STATUS.BAD_REQUEST);
      }
      return component.actions;
    }
    case "default":
      return scene.defaultActionIds;
    case "timer":
      return scene.timerActionIds;
    default:
      throw new HttpError(`Invalid trigger ${trigger}`, STATUS.BAD_REQUEST);
  }
};
