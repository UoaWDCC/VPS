// Mirrors DEFAULT_DIRECT_LINK_KEYS / directLinkKeysFor in
// frontend/src/features/authoring/keyBindings.ts. The backend and frontend
// are built and deployed separately, so this can't be imported from there -
// keep the two in sync.

// A scene's direct-link key defaults to responding to either Space or
// ArrowRight when the author hasn't chosen a specific key.
export const DEFAULT_DIRECT_LINK_KEYS = ["SPACE", "ARROWRIGHT"];

// `null`/`undefined` means the field was never configured (includes every
// scene saved before directLinkKey existed), so it falls back to the
// defaults. An empty string is an explicit "Custom mode chosen, but no key
// picked yet" state and claims nothing. Anything else is the one key it
// responds to.
export function directLinkKeysFor(directLinkKey) {
  if (directLinkKey == null) return DEFAULT_DIRECT_LINK_KEYS;
  if (!directLinkKey) return [];
  return [directLinkKey];
}
