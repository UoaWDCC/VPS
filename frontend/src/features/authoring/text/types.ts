import type { BaseTextStyle, ModelListMeta, RelativeBounds } from "../types";

export interface VisualSpan {
  text: string;
  style: BaseTextStyle;
  x: number;
  width: number;
  charOffsets: number[];
  parentId: number;
  startIndex: number;
}

export interface VisualLine {
  spans: VisualSpan[];
  x: number;
  y: number;
  width: number;
  height: number;
  baseline: number;
  maxFontSize: number;
  maxDescent: number;
}

export interface VisualBlock {
  lines: VisualLine[];
  style: BaseTextStyle;
  list?: ModelListMeta;
  softBreak?: boolean;
  y: number;
  height: number;
}

export interface VisualDocument {
  blocks: VisualBlock[];
  bounds: RelativeBounds;
  id: string;
  type: "text";
}

export interface VisualCursor {
  blockI: number;
  lineI: number;
  spanI: number;
  charI: number;
}

export interface ModelCursor {
  blockI: number;
  spanI: number;
  charI: number;
}

export interface ModelSelection {
  start: ModelCursor | null;
  end: ModelCursor | null;
}

export interface VisualSelection {
  start: VisualCursor | null;
  end: VisualCursor | null;
}

// a selection of bullet markers themselves (not their text) -- lets the
// user delete just the list formatting of a run of blocks without
// touching their content
export interface MarkerSelection {
  id: string;
  start: number;
  end: number;
}

export type Definite<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};
