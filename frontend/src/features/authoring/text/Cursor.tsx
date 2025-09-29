import type { RelativeBounds } from "../types";
import { add, expandToPath } from "../util";
import { getVisualPosition } from "./cursor";
import useEditorStore from "../stores/editor";
import shallow from "zustand/shallow";
import useVisualScene from "../stores/visual";
import { getStyleForSelection } from "../scene/operations/text";

function Cursor({ bounds }: { bounds: RelativeBounds }) {
  const visualSelection = useEditorStore(state => state.visualSelection);
  const modelSelection = useEditorStore(state => state.selection);
  const selected = useEditorStore(state => state.selected);

  if (!selected) return null;

  const { start, end } = visualSelection;
  if (start == null || (end && !shallow(start, end))) return null;

  const relativePosition = getVisualPosition(start, useVisualScene.getState().components[selected!].document.blocks);
  if (!relativePosition) return null;

  const position = add(relativePosition, bounds);
  const block = useVisualScene.getState().components[selected!].document.blocks[start.blockI];
  const line = block.lines[start.lineI];

  const box = {
    x: position.x,
    y: position.y,
    width: 3,
    height: line.height,
    rotation: bounds.rotation,
  };
  const origin = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  const path = expandToPath({ ...box, origin });
  const color = getStyleForSelection(selected, modelSelection)?.textColor;
  return <path d={path} fill={color ?? "#ffffff"} />;
}

export default Cursor;
