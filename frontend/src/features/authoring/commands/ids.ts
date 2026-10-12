import { v4 } from "uuid";

// Where the ids of new components come from. Normally they're random, but
// Plan mode runs a command twice, first as a dry run and then for real once
// the author approves, and the second run has to create the same things with
// the same ids, or a later step that mentions an earlier step's component
// would no longer find it. So a run can supply its own ids.

let source: () => string = v4;

/** A fresh id for something a command is creating. */
export const newId = () => source();

/** Runs `fn` with `next` as the source of new ids, then puts the old one back. */
export async function withIds<T>(
  next: () => string,
  fn: () => Promise<T>
): Promise<T> {
  const previous = source;
  source = next;
  try {
    return await fn();
  } finally {
    source = previous;
  }
}

/** An id source that remembers every id it hands out. */
export function recordIds() {
  const minted: string[] = [];
  return {
    minted,
    next: () => {
      const id = v4();
      minted.push(id);
      return id;
    },
  };
}

/** An id source that hands out `ids` in order, then random ones if it runs out. */
export function replayIds(ids: string[]) {
  const queue = [...ids];
  return () => queue.shift() ?? v4();
}
