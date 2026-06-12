export function merge(
  obj1: Record<PropertyKey, unknown>,
  obj2: Record<PropertyKey, unknown>
) {
  const updates = Object.fromEntries(
    Object.entries(obj2).filter(([, v]) => v !== undefined)
  );
  return { ...obj1, ...updates };
}

export function getObject(
  prop: string,
  obj: Record<PropertyKey, unknown>
): [Record<PropertyKey, unknown>, PropertyKey] {
  const keys = prop.split(".");
  const lastKey = keys.pop()!;
  return [keys.reduce((n: Record<PropertyKey, unknown>, key) => n[key] as Record<PropertyKey, unknown>, obj), lastKey];
}

export function arrayToObject(arr: { id: string }[]) {
  return arr.reduce((acc: Record<string, unknown>, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}
