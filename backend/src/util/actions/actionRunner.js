import { evaluateConditions } from "./conditionEvaluator.js";
import { applyPropertyOperations } from "../properties/propertyOperations.js";

// fractional index keys must be compared by code unit
const compareKeys = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// extracts action ids from a ref list, ordered by index
// with ties from concurrent edits broken by ref id
export const orderedActionIds = (refs) =>
  (refs ?? [])
    .slice()
    .sort((a, b) => compareKeys(a.index, b.index) || compareKeys(a.id, b.id))
    .map((ref) => ref.actionId);

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
    ...scene.components
      .filter((c) => c.clickable)
      .map((c) => orderedActionIds(c.actionRefs)),
    orderedActionIds(scene.defaultActionRefs),
    orderedActionIds(scene.timerActionRefs),
  ];

  const linkedIds = actionLists
    .flatMap((actionIds) => resolveActions(scene.actions, actionIds))
    .map((action) => action.linkedScene)
    .filter(Boolean)
    .map((id) => id.toString());

  const fallbackIds = [
    ...scene.components.filter((c) => c.clickable).map((c) => c.linkedScene),
    scene.defaultLinkedScene,
    scene.timerLinkedScene,
  ]
    .filter(Boolean)
    .map((id) => id.toString());

  linkedIds.push(...fallbackIds);

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
