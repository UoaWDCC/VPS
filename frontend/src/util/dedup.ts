export function dedupById<T extends { _id: string }>(arr: T[]): T[] {
  return Array.from(new Map(arr.map((item) => [item._id, item])).values());
}
