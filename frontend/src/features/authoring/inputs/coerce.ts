export const INVALID = Symbol("invalid");

export type Coerced<T> = T | typeof INVALID;
export type Raw<T> = string | T;

export function coerceNumber(raw: Raw<number | null> | typeof INVALID): Coerced<null | number> {
  if (raw === INVALID) return INVALID;
  if (raw === null || (typeof raw === "string" && raw.trim() === "")) return null;
  const parsed = typeof raw === "string" ? parseInt(raw, 10) : raw;
  return !isNaN(parsed) ? parsed : INVALID;
}

export function coerceRange(raw: number | null | typeof INVALID, min: number, max: number): Coerced<null | number> {
  if (raw === INVALID) return INVALID;
  if (raw === null) return null;
  if ((min !== null && raw < min) || (max !== null && raw > max)) return INVALID;
  return raw;
}
