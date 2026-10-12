import type { GenericComponent } from "./types";

// "/" and "'" are excluded since they open Firefox's Quick Find
const LETTERS = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(65 + i)
);
const DIGITS = Array.from({ length: 10 }, (_, i) => String(i));
const PUNCTUATION = ["-", "=", "[", "]", ";", ",", ".", "`", "\\"];

// SPACE is matched on e.code in normalizeEventKey, since its e.key is " "
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

export const DEFAULT_DIRECT_LINK_KEYS = ["SPACE", "ARROWRIGHT"];

// null = default keys, "" = custom with no key picked yet
export function directLinkKeysFor(
  directLinkKey: string | null | undefined
): string[] {
  if (directLinkKey == null) return DEFAULT_DIRECT_LINK_KEYS;
  if (!directLinkKey) return [];
  return [directLinkKey];
}

type KeyBoundComponent = Pick<
  GenericComponent,
  "id" | "clickable" | "keyBinding"
>;

type ActionableComponent = Pick<
  GenericComponent,
  "clickable" | "nextScene" | "stateOperations"
>;

export function hasClickAction(component: ActionableComponent): boolean {
  return !!(
    component.clickable &&
    (component.nextScene || (component.stateOperations?.length ?? 0) > 0)
  );
}

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
