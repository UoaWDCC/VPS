import { evaluateConditions } from "./conditionEvaluator.js";
import { applyPropertyOperations } from "../properties/propertyOperations.js";

export const resolveActions = (sceneActions, actionIds) => {
  if (!actionIds || actionIds.length === 0) return [];

  const actionsById = new Map(
    sceneActions.map((action) => [action.id, action])
  );

  return actionIds
    .map((actionId) => actionsById.get(actionId))
    .filter((action) => action != null);
};

// union of every linked scene reachable from a scene
export const getLinkedSceneIds = (scene) => {
  const actionLists = [
    ...scene.components.filter((c) => c.clickable).map((c) => c.actions),
    scene.defaultActionIds,
    scene.timerActionIds,
  ];

  const linkedIds = actionLists
    .flatMap((actionIds) => resolveActions(scene.actions, actionIds))
    .map((action) => action.linkedScene)
    .filter(Boolean)
    .map((id) => id.toString());

  return [...new Set(linkedIds)];
};

export const runActions = (actions, properties) => {
  let currentProperties = properties;
  let linkedScene = null;
  let changed = false;

  for (const action of actions) {
    if (!evaluateConditions(action.conditions, currentProperties)) continue;

    if (action.operations?.length) {
      currentProperties = applyPropertyOperations(
        currentProperties,
        action.operations
      );
      changed = true;
    }

    if (action.linkedScene) {
      linkedScene = action.linkedScene;
      break;
    }
  }

  return { properties: currentProperties, linkedScene, changed };
};
