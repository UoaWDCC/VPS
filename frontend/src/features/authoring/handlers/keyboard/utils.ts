const MAC_PLATFORMS = ["mac", "iphone", "ipad", "ipod"];

function getPlatform() {
  return (
    globalThis.navigator?.platform ??
    globalThis.navigator?.userAgent ??
    ""
  ).toLowerCase();
}

export function isMacPlatform() {
  const platform = getPlatform();
  return MAC_PLATFORMS.some((name) => platform.includes(name));
}

export function isPrimaryShortcutModifier(e: KeyboardEvent) {
  return isMacPlatform() ? e.metaKey : e.ctrlKey;
}

export function isEditableShortcutTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase();
}

function hasOnlyRequestedModifiers(e: KeyboardEvent, modifiers: Set<string>) {
  const usesPrimary = modifiers.has("mod");
  const usesCtrl = modifiers.has("ctrl");
  const usesMeta = modifiers.has("meta");
  const usesShift = modifiers.has("shift");
  const usesAlt = modifiers.has("alt") || modifiers.has("option");

  if (usesPrimary) {
    if (!isPrimaryShortcutModifier(e)) return false;
  } else {
    if (usesCtrl !== e.ctrlKey) return false;
    if (usesMeta !== e.metaKey) return false;
  }
  if (usesShift !== e.shiftKey) return false;
  if (usesAlt !== e.altKey) return false;

  return true;
}

export function matchesShortcut(e: KeyboardEvent, combo: string) {
  if (e.repeat) return false;

  const parts = combo
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  const key = normalizeKey(parts.pop() ?? "");
  const modifiers = new Set(parts);

  if (!hasOnlyRequestedModifiers(e, modifiers)) return false;

  return normalizeKey(e.key) === key;
}
