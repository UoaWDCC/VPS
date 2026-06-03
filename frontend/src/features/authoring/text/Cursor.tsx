import type { RelativeBounds } from "../types";
import { add, expandToPath } from "../util";
import { getVisualPosition } from "./cursor";
import useEditorStore from "../stores/editor";
import shallow from "zustand/shallow";
import useVisualScene from "../stores/visual";
import { getStyleForSelection } from "../scene/operations/text";

function Cursor({ bounds }: { bounds: RelativeBounds }) {
  const visualSelection = useEditorStore((state) => state.visualSelection);
  const modelSelection = useEditorStore((state) => state.selection);

  const { selected } = useEditorStore.getState();
  const { components } = useVisualScene.getState();
  const { blocks } = components[selected!].document;

  const { start, end } = visualSelection;
  if (start == null || (end && !shallow(start, end))) return null;

  const relativePosition = getVisualPosition(start, blocks);
  if (!relativePosition) return null;

  const position = add(relativePosition, bounds);
  const line = blocks[start.blockI].lines[start.lineI];
  const span = line.spans[start.spanI];
  if (!span?.style?.fontSize) return null;
  const cursorHeight = span.style.fontSize;
  const cursorBottomPadding = span.style.fontSize * 0.25;

  const box = {
    x: position.x,
    y: position.y + line.baseline - cursorHeight,
    width: 3,
    height: cursorHeight + cursorBottomPadding,
    rotation: bounds.rotation,
  };
  const origin = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  const path = expandToPath({ ...box, origin });
  const color = getStyleForSelection(selected!, modelSelection)?.textColor;
  return <path d={path} fill={color ?? "#000000"} />;
}

export default Cursor;
