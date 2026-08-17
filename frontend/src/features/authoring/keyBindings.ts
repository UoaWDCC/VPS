// Single, unmodified keys an author may bind a button (or a scene's direct
// link) to during playback. Excludes anything still reserved: Enter/Tab/
// Escape/Backspace/Delete/F-keys/modifiers, and "/" and "'" (both trigger
// Firefox's Quick Find when pressed unmodified).
const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const DIGITS = Array.from({ length: 10 }, (_, i) => String(i));
const PUNCTUATION = ["-", "=", "[", "]", ";", ",", ".", "`", "\\"];

// Single source of truth for keys with no printable single-character glyph:
// their internal id, how to recognize them off a KeyboardEvent, and how to
// display them. SPACE is matched via e.code (see normalizeEventKey) rather
// than a nativeKey here, since e.key for Space is a literal " ".
const NAMED_KEYS: Record<string, { nativeKey?: string; display: string }> = {
  SPACE: { display: "Space" },
  ARROWUP: { nativeKey: "ArrowUp", display: "↑" },
  ARROWDOWN: { nativeKey: "ArrowDown", display: "↓" },
  ARROWLEFT: { nativeKey: "ArrowLeft", display: "←" },
  ARROWRIGHT: { nativeKey: "ArrowRight", display: "→" },
};

const NATIVE_KEY_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(NAMED_KEYS)
    .filter(([, { nativeKey }]) => nativeKey)
    .map(([id, { nativeKey }]) => [nativeKey as string, id])
);

export const KEY_BINDING_OPTIONS = [
  ...LETTERS,
  ...DIGITS,
  ...PUNCTUATION,
  ...Object.keys(NAMED_KEYS),
];

export function displayKeyBinding(key: string): string {
  return NAMED_KEYS[key]?.display ?? key;
}

export function normalizeEventKey(e: KeyboardEvent): string | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  if (e.code === "Space") return "SPACE";
  if (e.key in NATIVE_KEY_TO_ID) return NATIVE_KEY_TO_ID[e.key];
  const key = e.key.length === 1 ? e.key.toUpperCase() : null;
  return key && KEY_BINDING_OPTIONS.includes(key) ? key : null;
}

// A scene's direct-link key defaults to responding to either Space or
// ArrowRight when the author hasn't chosen a specific key.
export const DEFAULT_DIRECT_LINK_KEYS = ["SPACE", "ARROWRIGHT"];

// `null`/`undefined` means the field was never configured (includes every
// scene saved before directLinkKey existed), so it falls back to responding
// to Space or ArrowRight. An empty string is a distinct, explicit "Custom
// mode chosen, but no key picked yet" state - it claims nothing at all
// until the author picks one, rather than silently keeping the defaults
// reserved. Anything else is the one specific key it responds to.
export function directLinkKeysFor(
  directLinkKey: string | null | undefined
): string[] {
  if (directLinkKey == null) return DEFAULT_DIRECT_LINK_KEYS;
  if (!directLinkKey) return [];
  return [directLinkKey];
}

interface KeyBoundComponent {
  id: string;
  clickable?: boolean;
  keyBinding?: string | null;
}

// Keys already claimed by clickable components, so a new binding can't
// collide with one of them. Pass excludeComponentId when checking a
// component against its scene-mates (so it doesn't count its own key).
export function usedComponentKeys(
  components: KeyBoundComponent[],
  excludeComponentId?: string
): string[] {
  return components
    .filter(
      (c): c is KeyBoundComponent & { keyBinding: string } =>
        !!c.clickable && !!c.keyBinding && c.id !== excludeComponentId
    )
    .map((c) => c.keyBinding);
}

// The full set of keys still free to bind, after excluding whatever's
// already claimed by other clickable components and (optionally) the
// scene's direct link. Shared by the component and direct-link key pickers
// so "what counts as used" can't drift between them.
export function availableKeyBindings(
  components: KeyBoundComponent[],
  options: {
    excludeComponentId?: string;
    directLink?: string | null;
    directLinkKey?: string | null;
  } = {}
): string[] {
  const used = [
    ...usedComponentKeys(components, options.excludeComponentId),
    ...(options.directLink ? directLinkKeysFor(options.directLinkKey) : []),
  ];
  return KEY_BINDING_OPTIONS.filter((k) => !used.includes(k));
}
