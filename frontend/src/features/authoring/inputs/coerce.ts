export const INVALID = Symbol("invalid");

export type Coerced<T> = T | typeof INVALID;
export type Raw<T> = string | null | T;

export function coerceInt(raw: Raw<number | null>): Coerced<null | number> {
  if (raw === null || (typeof raw === "string" && raw.trim() === "")) return null;
  const parsed = typeof raw === "string" ? Number(raw) : raw;
  return Number.isInteger(parsed) ? parsed : INVALID;
}

export function coerceFloat(raw: Raw<number | null>): Coerced<null | number> {
  if (raw === null || (typeof raw === "string" && raw.trim() === "")) return null;
  const parsed = typeof raw === "string" ? Number(raw) : raw;
  return Number.isFinite(parsed) ? parsed : INVALID;
}

export function coerceRequired<T>(raw: T | null): Coerced<T> {
  return raw === null ? INVALID : raw;
}

export function coerceRange(min: number, max: number) {
  return (raw: number | null): Coerced<number | null> => {
    if (raw === null) return null;
    if ((min !== null && raw < min) || (max !== null && raw > max)) return INVALID;
    return raw;
  }
}
