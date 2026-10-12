import { operations } from "../../../components/Properties/propertyTypes.js";

const MAX_LABEL_LENGTH = 24;

function firstText(component) {
  for (const block of component.document?.blocks ?? []) {
    for (const span of block.spans ?? []) {
      const text = (span.property ? span.property.displayName : span.text)
        ?.toString()
        .trim();
      if (text) return text;
    }
  }
  return null;
}

/**
 * A short, human-readable name for a component: the text it displays if it has
 * any, otherwise its type and the start of its id.
 */
export function componentLabel(component) {
  const text = firstText(component);
  if (text) {
    const short =
      text.length > MAX_LABEL_LENGTH
        ? `${text.slice(0, MAX_LABEL_LENGTH - 1).trimEnd()}…`
        : text;
    return `"${short}"`;
  }

  const type = component.type ?? "component";
  const id = String(component.id ?? "").slice(0, 4);
  return `${type.charAt(0).toUpperCase()}${type.slice(1)} ${id}`.trim();
}

export function formatValue(value) {
  return typeof value === "string" ? `"${value}"` : String(value);
}

/**
 * Describes a property operation, e.g. `heartRate − 15` or `fluidsGiven = true`.
 * Operations pointing at a deleted property are marked as such.
 */
export function describeOperation(operation, properties) {
  const property = properties?.find(
    (candidate) => candidate.id === operation.stateVariableId
  );
  const name = property
    ? property.name
    : `${operation.displayName ?? "unknown property"} (deleted)`;
  const value = formatValue(operation.value);

  switch (operation.operation) {
    case operations.SET:
      return `${name} = ${value}`;
    case operations.ADD:
      return `${name} + ${value}`;
    case operations.SUBTRACT:
      return `${name} − ${value}`;
    default:
      return `${name} ${operation.operation} ${value}`;
  }
}

/**
 * Describes a destination rule's condition, e.g. `heartRate > 120`. A rule
 * pointing at a deleted property is marked as such.
 */
export function describeCondition(rule, properties) {
  const property = properties?.find(
    (candidate) => candidate.id === rule.stateVariableId
  );
  const name = property ? property.name : "a deleted property";
  return `${name} ${rule.comparator} ${formatValue(rule.value)}`;
}

/**
 * What decided where a button with destination rules led: the rule that
 * matched, or the fallback. Nothing for a button without rules.
 *
 * @param {object} component the button
 * @param {Array} properties the properties the rules were judged on
 * @param {number} ruleIndex the rule that matched, or -1 for the fallback
 * @param {(sceneId: string) => string} sceneName
 */
export function describeDecision(component, properties, ruleIndex, sceneName) {
  const rules = component.nextSceneRules ?? [];
  if (!rules.length) return [];

  if (ruleIndex >= 0) {
    const rule = rules[ruleIndex];
    const property = properties.find((p) => p.id === rule.stateVariableId);
    return [
      `Rule ${ruleIndex + 1} matched: ${describeCondition(rule, properties)} (it is ${formatValue(property?.value)})`,
      `So it goes to ${sceneName(rule.sceneId)}`,
    ];
  }

  return [
    "No rule matched",
    component.nextScene
      ? `So it goes to ${sceneName(component.nextScene)}, its own scene`
      : "And it has no scene of its own, so the player stays here",
  ];
}
