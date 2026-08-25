import type { ModelDocument, ModelSpan, PropertyRef } from "../types";

//unicode placeholder character for chip + horizontal side padding
export const PROPERTY_CHAR = "\uFFFC";
export const CHIP_X_PADDING = 6;

export interface Property {
  id: string;
  name: string;
}

export function isProperty(
  span: ModelSpan
): span is ModelSpan & { property: PropertyRef } {
  return span.property !== undefined;
}

export function findPropertyIdByName(properties: Property[], name: string) {
  return properties.find((p) => p.name === name)?.id ?? null;
}

//convert span chip to $$name$$ text
export function spanToText(span: ModelSpan) {
  if (!span.property) return span.text;
  return `$$${span.property.displayName}$$`;
}

//checks property chip id-name map for drift (eg missing/deleted)
export function syncPropertyChips(doc: ModelDocument, properties: Property[]) {
  const byId = new Map(properties.map((p) => [p.id, p.name]));
  let changed = false;

  for (const block of doc.blocks) {
    for (const span of block.spans) {
      if (!isProperty(span)) continue;

      const prop = span.property;
      const live = byId.get(prop.id);
      const name = live ?? prop.displayName;

      if (prop.displayName === name && !!prop.missing === !live) continue;

      prop.displayName = name;
      if (live) delete prop.missing;
      else prop.missing = true;
      changed = true;
    }
  }

  return changed;
}
