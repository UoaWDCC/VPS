import type { Component } from "../types";

export type LayerDirection = "forward" | "backward";
export type LayerMode = "step" | "extreme";

/**
 * Which zIndex values have to change to move components through the stack,
 * one step at a time or all the way to the front or back. Pure: it only looks
 * at the components it's given, so the editor and the AI commands share it.
 *
 * Returns nothing for a move that changes nothing, so it costs no undo step.
 */
export function computeLayerChanges(
  components: Component[],
  ids: string[],
  direction: LayerDirection,
  mode: LayerMode
): { id: string; zIndex: number }[] {
  if (!ids.length) return [];

  const selectedIds = new Set(ids);

  // Sort by zIndex (ascending) — this is the order the canvas renders
  const sortedComponents = [...components].sort(
    (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)
  );
  const rawZIndexScale = sortedComponents.map((c) => c.zIndex ?? 0);

  // Components tied on one zIndex have no order to swap, so reordering them
  // against the original scale writes back the values they already had.
  // Renumber onto a strictly increasing scale first; the sort is stable, so
  // this preserves the order currently on screen.
  const hasDuplicates = new Set(rawZIndexScale).size !== rawZIndexScale.length;
  const zIndexScale = hasDuplicates
    ? sortedComponents.map((_, index) => index)
    : rawZIndexScale;

  let newSortedComponents: Component[] = [];

  if (mode === "extreme") {
    // Bring to Front / Send to Back
    const selected = sortedComponents.filter((c) => selectedIds.has(c.id));
    const unselected = sortedComponents.filter((c) => !selectedIds.has(c.id));

    newSortedComponents =
      direction === "forward"
        ? [...unselected, ...selected] // Front: unselected first, then selected on top
        : [...selected, ...unselected]; // Back: selected on bottom, then unselected
  } else {
    // Bring Forward / Send Backward (Single step)
    newSortedComponents = [...sortedComponents];

    if (direction === "forward") {
      // Loop backward to move items up without overwriting consecutive selections
      for (let i = newSortedComponents.length - 1; i >= 0; i--) {
        if (
          selectedIds.has(newSortedComponents[i].id) &&
          i < newSortedComponents.length - 1 &&
          !selectedIds.has(newSortedComponents[i + 1].id)
        ) {
          const temp = newSortedComponents[i];
          newSortedComponents[i] = newSortedComponents[i + 1];
          newSortedComponents[i + 1] = temp;
        }
      }
    } else {
      // Loop forward to move items down
      for (let i = 0; i < newSortedComponents.length; i++) {
        if (
          selectedIds.has(newSortedComponents[i].id) &&
          i > 0 &&
          !selectedIds.has(newSortedComponents[i - 1].id)
        ) {
          const temp = newSortedComponents[i];
          newSortedComponents[i] = newSortedComponents[i - 1];
          newSortedComponents[i - 1] = temp;
        }
      }
    }
  }

  // Renumbering rewrites every tied component, so a reorder that moves nothing
  // must bail out before it costs an undo step and a full-scene save.
  const orderUnchanged = newSortedComponents.every(
    (comp, index) => comp.id === sortedComponents[index].id
  );
  if (orderUnchanged) return [];

  // Apply target zIndices back to modified components
  return newSortedComponents
    .map((comp, index) => ({
      id: comp.id,
      zIndex: zIndexScale[index],
      current: comp.zIndex,
    }))
    .filter(({ zIndex, current }) => current !== zIndex)
    .map(({ id, zIndex }) => ({ id, zIndex }));
}
