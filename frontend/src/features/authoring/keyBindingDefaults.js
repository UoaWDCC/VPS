// Plain JS on purpose, not .ts - backend/src/db/daos/sceneDao.js imports
// this file directly via a relative path, and it runs as raw Node with no
// TypeScript loader. Keep this file free of TS-only syntax (annotations
// live in JSDoc below so frontend callers still get real types).

// A scene's direct-link key defaults to responding to either Space or
// ArrowRight when the author hasn't chosen a specific key.
export const DEFAULT_DIRECT_LINK_KEYS = ["SPACE", "ARROWRIGHT"];

// `null`/`undefined` means the field was never configured (includes every
// scene saved before directLinkKey existed), so it falls back to responding
// to Space or ArrowRight. An empty string is a distinct, explicit "Custom
// mode chosen, but no key picked yet" state - it claims nothing at all
// until the author picks one, rather than silently keeping the defaults
// reserved. Anything else is the one specific key it responds to.
/**
 * @param {string | null | undefined} directLinkKey
 * @returns {string[]}
 */
export function directLinkKeysFor(directLinkKey) {
  if (directLinkKey == null) return DEFAULT_DIRECT_LINK_KEYS;
  if (!directLinkKey) return [];
  return [directLinkKey];
}
