export function merge(
  obj1: Record<PropertyKey, any>,
  obj2: Record<PropertyKey, any>,
) {
  const updates = Object.fromEntries(
    Object.entries(obj2).filter(([_, v]) => v !== undefined),
  );
  return { ...obj1, ...updates };
}

export function getObject(
  prop: string,
  obj: Record<PropertyKey, any>,
): [Record<PropertyKey, any>, PropertyKey] {
  const keys = prop.split(".");
  const lastKey = keys.pop()!;
  return [keys.reduce((n, key) => n[key], obj), lastKey];
}

export function arrayToObject(arr: { id: string }[]) {
  return arr.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}