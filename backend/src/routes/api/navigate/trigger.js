import { HttpError } from "../../../util/error.js";
import {
  orderedActionIds,
  resolveActions,
} from "../../../util/actions/actionRunner.js";
import { HttpStatusCode } from "axios";

function resolveRefs(actions, ids, fallback) {
  const resolved = resolveActions(actions, orderedActionIds(ids));
  return { actions: resolved, fallback };
}

// resolves the ordered actions for the given trigger
export function resolveTrigger(scene, trigger, componentId) {
  switch (trigger) {
    case "click": {
      if (!componentId)
        throw new HttpError(
          "componentId is required for click trigger",
          HttpStatusCode.BadRequest
        );
      const component = scene.components.find((c) => c.id === componentId);
      if (!component)
        throw new HttpError(
          "component does not exist",
          HttpStatusCode.BadRequest
        );
      if (!component.clickable)
        throw new HttpError(
          "component is not clickable",
          HttpStatusCode.BadRequest
        );
      return resolveRefs(
        scene.actions,
        component.actionRefs,
        component.linkedScene
      );
    }
    case "default":
      return resolveRefs(
        scene.actions,
        scene.defaultActionRefs,
        scene.defaultLinkedScene
      );
    case "timer":
      return resolveRefs(
        scene.actions,
        scene.timerActionRefs,
        scene.timerLinkedScene
      );
    default:
      throw new HttpError(
        `invalid trigger ${trigger}`,
        HttpStatusCode.BadRequest
      );
  }
}
