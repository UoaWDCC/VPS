export const DEFAULT_TRIGGER_KEYS = ["SPACE", "ARROWRIGHT"];

// null = default keys, "" = custom with no key picked yet
export function defaultTriggerKeysFor(defaultKeyBinding) {
  if (defaultKeyBinding == null) return DEFAULT_TRIGGER_KEYS;
  if (!defaultKeyBinding) return [];
  return [defaultKeyBinding];
}

export function hasDefaultTrigger(scene) {
  return !!(scene.defaultLinkedScene || scene.defaultActionRefs?.length);
}
