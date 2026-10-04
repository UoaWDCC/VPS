import type { Property } from "../text/property";
import type { PropertyValue } from "../types";

export const INVALID = Symbol("invalid");

export type Coerced<T> = T | typeof INVALID;
export type Coercer<D, T> = (draft: D, committed: T) => Coerced<T>;

export function pipe<A, B, C>(
  f: Coercer<A, B>,
  g: Coercer<B, C>
): Coercer<A, C>;
export function pipe<A, B, C, E>(
  f: Coercer<A, B>,
  g: Coercer<B, C>,
  h: Coercer<C, E>
): Coercer<A, E>;
export function pipe<A, B, C, E, F>(
  f: Coercer<A, B>,
  g: Coercer<B, C>,
  h: Coercer<C, E>,
  i: Coercer<E, F>
): Coercer<A, F>;
export function pipe(...steps: Coercer<unknown, unknown>[]) {
  return (draft: unknown, committed: unknown) => {
    let current = draft;
    for (const step of steps) {
      const next = step(current, committed);
      if (next === INVALID) return INVALID;
      current = next;
    }
    return current;
  };
}

export function coerceInt(raw: string): Coerced<null | number> {
  if (raw.trim() === "") return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : INVALID;
}

export function coerceFloat(raw: string): Coerced<null | number> {
  if (raw.trim() === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : INVALID;
}

export function coerceRequired<T>(raw: T | null): Coerced<T> {
  return raw === null ? INVALID : raw;
}

export function coerceRange(min: number | null, max: number | null) {
  return (raw: number | null): Coerced<number | null> => {
    if (raw === null) return null;
    if ((min !== null && raw < min) || (max !== null && raw > max))
      return INVALID;
    return raw;
  };
}

export function coerceUniqueName(existing: string[]) {
  return (raw: string, committed: string): Coerced<string> => {
    const name = raw.trim();
    if (!name.length) return INVALID;
    if (existing.filter((n) => n !== committed).includes(name)) return INVALID;
    return name;
  };
}

export function coercePropertyValue(type: Property["type"] | undefined) {
  return (raw: string): Coerced<PropertyValue> => {
    switch (type) {
      case "string":
        return raw;
      case "number": {
        if (raw.trim() === "") return INVALID;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : INVALID;
      }
      case "boolean":
        if (raw === "true") return true;
        if (raw === "false") return false;
        return INVALID;
      default:
        return INVALID;
    }
  };
}

export function coercePropertyExists(properties: Property[]) {
  return (raw: string): Coerced<string> => {
    if (properties.find((p) => p.id === raw)) return raw;
    else return INVALID;
  };
}

export function coerceOneOf<T>(allowed: T[]) {
  return (raw: T): Coerced<T> => (allowed.includes(raw) ? raw : INVALID);
}
