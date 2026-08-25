export const KEY_HINT_POSITIONS = [
  "topLeft",
  "topCenter",
  "topRight",
  "bottomLeft",
  "bottomCenter",
  "bottomRight",
] as const;

export type KeyHintPosition = (typeof KEY_HINT_POSITIONS)[number];

export const DEFAULT_KEY_HINT_POSITION: KeyHintPosition = "topRight";

const LABELS: Record<KeyHintPosition, string> = {
  topLeft: "Top Left",
  topCenter: "Top Center",
  topRight: "Top Right",
  bottomLeft: "Bottom Left",
  bottomCenter: "Bottom Center",
  bottomRight: "Bottom Right",
};

export function displayKeyHintPosition(position: string): string {
  return LABELS[position as KeyHintPosition] ?? position;
}
