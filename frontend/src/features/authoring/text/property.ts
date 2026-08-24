import type { ModelSpan, PropertyRef } from "../types";

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

//convert span chip to $$name$$ text
export function spanToText(span: ModelSpan) {
  if (!span.property) return span.text;
  return `$$${span.property.displayName}$$`;
}
