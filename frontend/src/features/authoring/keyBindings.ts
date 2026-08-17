// Single, unmodified keys an author may bind a button (or a scene's direct
// link) to during playback. Excludes anything still reserved: Enter/Tab/
// Escape/Backspace/Delete/F-keys/modifiers, and "/" and "'" (both trigger
// Firefox's Quick Find when pressed unmodified).
const LETTERS = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(65 + i)
);
const DIGITS = Array.from({ length: 10 }, (_, i) => String(i));
const PUNCTUATION = ["-", "=", "[", "]", ";", ",", ".", "`", "\\"];
const NAMED_KEYS = ["SPACE", "ARROWUP", "ARROWDOWN", "ARROWLEFT", "ARROWRIGHT"];

export const KEY_BINDING_OPTIONS = [
  ...LETTERS,
  ...DIGITS,
  ...PUNCTUATION,
  ...NAMED_KEYS,
];

const ARROW_KEY_IDS: Record<string, string> = {
  ArrowUp: "ARROWUP",
  ArrowDown: "ARROWDOWN",
  ArrowLeft: "ARROWLEFT",
  ArrowRight: "ARROWRIGHT",
};

const KEY_DISPLAY: Record<string, string> = {
  SPACE: "Space",
  ARROWUP: "↑",
  ARROWDOWN: "↓",
  ARROWLEFT: "←",
  ARROWRIGHT: "→",
};

export function displayKeyBinding(key: string): string {
  return KEY_DISPLAY[key] ?? key;
}

export function normalizeEventKey(e: KeyboardEvent): string | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  if (e.code === "Space") return "SPACE";
  if (e.key in ARROW_KEY_IDS) return ARROW_KEY_IDS[e.key];
  const key = e.key.length === 1 ? e.key.toUpperCase() : null;
  return key && KEY_BINDING_OPTIONS.includes(key) ? key : null;
}

// A scene's direct-link key defaults to responding to either Space or
// ArrowRight when the author hasn't chosen a specific key.
export const DEFAULT_DIRECT_LINK_KEYS = ["SPACE", "ARROWRIGHT"];

export function directLinkKeysFor(directLinkKey: string | null | undefined) {
  return directLinkKey ? [directLinkKey] : DEFAULT_DIRECT_LINK_KEYS;
}
