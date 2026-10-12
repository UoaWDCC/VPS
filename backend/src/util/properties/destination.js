// Where a button leads, given the player's properties.
//
// A button leads to its `nextScene`, unless one of its `nextSceneRules`
// matches. Rules are checked in order and the first match wins:
//
//   nextSceneRules: [
//     { stateVariableId, comparator: "=" | "!=" | ">" | "<", value, sceneId },
//   ]
//
// `nextScene` is the fallback for when no rule matches. The properties to
// check are the ones after the button's own property operations, so a button
// that adds 10 to a score is judged on the new score.
//
// A rule that can't be judged never matches: its property is gone, the value
// is a different type to the property, or `>` / `<` is used on something that
// isn't a number.
//
// The server decides where a player goes and the play page predicts it with
// the same rules, so this file is shared word for word between the backend
// (util/properties) and the frontend (components/Properties). A frontend test
// fails if the two copies drift apart.

export const COMPARATORS = ["=", "!=", ">", "<"];

/** Whether `rule` holds for the given properties. */
export function ruleMatches(rule, properties) {
  const property = properties?.find((p) => p.id === rule?.stateVariableId);
  if (!property) return false;

  const actual = property.value;
  const expected = rule.value;
  if (typeof actual !== typeof expected) return false;
  if (
    typeof actual === "number" &&
    (Number.isNaN(actual) || Number.isNaN(expected))
  )
    return false;

  switch (rule.comparator) {
    case "=":
      return actual === expected;
    case "!=":
      return actual !== expected;
    case ">":
      return typeof actual === "number" && actual > expected;
    case "<":
      return typeof actual === "number" && actual < expected;
    default:
      return false;
  }
}

/**
 * Where pressing `component` leads.
 *
 * @returns {{ sceneId: string | null | undefined, ruleIndex: number }}
 *   the scene (undefined when the button leads nowhere) and the index of the
 *   rule that sent the player there, or -1 for the fallback
 */
export function resolveDestination(component, properties) {
  const rules = component?.nextSceneRules;
  if (Array.isArray(rules)) {
    for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
      const rule = rules[ruleIndex];
      if (rule?.sceneId && ruleMatches(rule, properties))
        return { sceneId: rule.sceneId, ruleIndex };
    }
  }
  return { sceneId: component?.nextScene, ruleIndex: -1 };
}

/** Every scene `component` can lead to: the fallback and each rule's scene. */
export function destinationSceneIds(component) {
  const rules = Array.isArray(component?.nextSceneRules)
    ? component.nextSceneRules
    : [];
  return [
    ...new Set(
      [component?.nextScene, ...rules.map((rule) => rule?.sceneId)].filter(
        Boolean
      )
    ),
  ];
}
