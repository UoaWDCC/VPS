export function normaliseString(raw) {
  return typeof raw === "string" ? raw.trim().toLowerCase() : null;
}
