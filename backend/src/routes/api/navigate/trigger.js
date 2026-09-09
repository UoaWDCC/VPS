import { HttpError } from "../../../util/error.js";
import STATUS from "../../../util/status.js";
import { orderedActionIds } from "../../../util/actions/actionRunner.js";

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
      if (!component.clickable) {
        throw new HttpError("Component is not clickable", STATUS.BAD_REQUEST);
      }
      return orderedActionIds(component.actionRefs);
    }
    case "default":
      return orderedActionIds(scene.defaultActionRefs);
    case "timer":
      return orderedActionIds(scene.timerActionRefs);
    default:
      throw new HttpError(`Invalid trigger ${trigger}`, STATUS.BAD_REQUEST);
  }
};
