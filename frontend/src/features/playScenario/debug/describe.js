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
