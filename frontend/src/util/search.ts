export function findById<T extends { _id: string }>(
  arr: T[],
  target: string
): T | null {
  if (!Array.isArray(arr)) return null;
  return arr.find((item) => item._id === target) ?? null;
}
