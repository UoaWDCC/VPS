import { getComponentProp } from "../scene/scene";
import { setBlockListStyle } from "../scene/operations/text";
import useEditorStore from "../stores/editor";
import type { ListMarkerStyle, ModelDocument } from "../types";
import type { VisualDocument } from "./types";

// the contiguous run of list blocks around blockI (a "list group") -- used
// both for the initial click-to-select and to re-derive the same range on
// a later action (context menu, Tab) when the selection wasn't just made
export function getListGroupRange(doc: VisualDocument, blockI: number) {
  let start = blockI;
  while (start > 0 && doc.blocks[start - 1].list) start--;
  let end = blockI;
  while (end < doc.blocks.length - 1 && doc.blocks[end + 1].list) end++;
  return { start, end };
}

// resolves the block range an action should apply to for a given textbox:
// an active text selection/cursor takes priority, otherwise falls back to
// a marker selection (bullets selected as objects, not text) on that box
export function getBlockRange(id: string) {
  const { selection, markerSelection } = useEditorStore.getState();
  const { start, end } = selection;

  if (start) {
    return {
      start: Math.min(start.blockI, end?.blockI ?? start.blockI),
      end: Math.max(start.blockI, end?.blockI ?? start.blockI),
    };
  }

  if (markerSelection && markerSelection.id === id) {
    return { start: markerSelection.start, end: markerSelection.end };
  }

  return null;
}

export function getListStyleForSelection(id: string): ListMarkerStyle | "none" {
  const range = getBlockRange(id);
  if (!range) return "none";

  const doc = getComponentProp(id, "document") as ModelDocument;
  return doc.blocks[range.start]?.list?.markerStyle ?? "none";
}

export function setListStyle(
  selected: string,
  value: ListMarkerStyle | "none"
) {
  const range = getBlockRange(selected);
  if (!range) return;

  setBlockListStyle([selected], range, value);
}

// mod+shift+8 -- toggles the round bullet style on/off for the current
// block(s)
export function toggleBulletShortcut(selected: string) {
  const range = getBlockRange(selected);
  if (!range) return;

  const current = getListStyleForSelection(selected);
  setBlockListStyle(
    [selected],
    range,
    current === "bullet" ? "none" : "bullet"
  );
}
