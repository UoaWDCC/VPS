import type { GenericComponent, Scene } from "./types";

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

export const DEFAULT_TRIGGER_KEYS = ["SPACE", "ARROWRIGHT"];

// null = default keys, "" = custom with no key picked yet
export function defaultTriggerKeysFor(
  defaultKeyBinding: string | null | undefined
): string[] {
  if (defaultKeyBinding == null) return DEFAULT_TRIGGER_KEYS;
  if (!defaultKeyBinding) return [];
  return [defaultKeyBinding];
}

type KeyBoundComponent = Pick<
  GenericComponent,
  "id" | "clickable" | "keyBinding"
>;

type ActionableComponent = Pick<
  GenericComponent,
  "clickable" | "actionRefs" | "linkedScene"
>;

type DefaultTrigger = Pick<Scene, "defaultLinkedScene" | "defaultActionRefs">;

export function hasClickAction(component: ActionableComponent): boolean {
  return !!(
    component.clickable &&
    (component.linkedScene || (component.actionRefs?.length ?? 0) > 0)
  );
}

export function hasDefaultTrigger(scene: Partial<DefaultTrigger>): boolean {
  return !!(scene.defaultLinkedScene || scene.defaultActionRefs?.length);
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
    hasDefaultTrigger?: boolean;
    defaultKeyBinding?: string | null;
  } = {}
): string[] {
  const used = [
    ...usedComponentKeys(components, options.excludeComponentId),
    ...(options.hasDefaultTrigger
      ? defaultTriggerKeysFor(options.defaultKeyBinding)
      : []),
  ];
  return KEY_BINDING_OPTIONS.filter((k) => !used.includes(k));
}
