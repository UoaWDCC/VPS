import type { RelativeBounds } from "../types";
import { add, expandToPath } from "../util";
import { getVisualPosition } from "./cursor";
import useEditorStore from "../stores/editor";
import type { VisualBlock } from "./types";
import shallow from "zustand/shallow";
import useVisualScene from "../stores/visual";

function Cursor({
  blocks,
  bounds,
}: {
  blocks: VisualBlock[];
  bounds: RelativeBounds;
}) {
  const selection = useEditorStore(state => state.visualSelection);
  const selected = useEditorStore(state => state.selected);

  const { start, end } = selection;
  if (start == null || (end && !shallow(start, end))) return null;

  const relativePosition = getVisualPosition(start, useVisualScene.getState().components[selected!].document.blocks);
  if (!relativePosition) return null;

  const position = add(relativePosition, bounds);
  const block = useVisualScene.getState().components[selected!].document.blocks[start.blockI];
  const line = block.lines[start.lineI];

  const box = {
    x: position.x,
    y: position.y,
    width: 2,
    height: line.height,
    rotation: bounds.rotation,
  };
  const origin = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  const path = expandToPath({ ...box, origin });
  return <path d={path} fill="#ffffff" />;
}

export default Cursor;
