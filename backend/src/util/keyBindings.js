export const DEFAULT_DIRECT_LINK_KEYS = ["SPACE", "ARROWRIGHT"];

// null = default keys, "" = custom with no key picked yet
export function directLinkKeysFor(directLinkKey) {
  if (directLinkKey == null) return DEFAULT_DIRECT_LINK_KEYS;
  if (!directLinkKey) return [];
  return [directLinkKey];
}
