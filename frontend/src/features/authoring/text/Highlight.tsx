import type { RelativeBounds } from "../types";
import { expandToPath } from "../util";
import { normalizeSelectionVisual } from "./cursor";
import type {
  Definite,
  VisualBlock,
  VisualCursor,
  VisualSelection,
  VisualSpan,
} from "./types";
import useEditorStore from "../stores/editor";
import useVisualScene from "../stores/visual";

interface HighlightProps {
  color: string;
  bounds: RelativeBounds;
}

function isValidSelection(selection: VisualSelection, blocks: VisualBlock[]) {
  const { start, end } = selection;
  if (!start || !end) return false;

  const isValidPos = (pos: VisualCursor): boolean => {
    if (pos.blockI < 0 || pos.blockI >= blocks.length) return false;
    const block = blocks[pos.blockI];
    if (pos.lineI < 0 || pos.lineI >= block.lines.length) return false;
    const line = block.lines[pos.lineI];
    if (pos.spanI < 0 || pos.spanI >= line.spans.length) return false;
    const span = line.spans[pos.spanI];
    if (pos.charI < 0 || pos.charI > span.text.length) return false;
    return true;
  };

  if (!isValidPos(start) || !isValidPos(end)) return false;
  return true;
}

function genSeg(sel: Definite<VisualSelection>, span: VisualSpan, isStart: boolean, isEnd: boolean) {
  let x = span.x, width = span.width;
  if (isStart && isEnd) {
    x += span.charOffsets[sel.start.charI];
    width = span.charOffsets[sel.end.charI] + span.x - x;
  } else if (isStart) {
    x += span.charOffsets[sel.start.charI];
    width += span.x - x;
  } else if (isEnd) {
    width = span.charOffsets[sel.end.charI];
  }

  return { x, width };
}

function genSegs(selection: Definite<VisualSelection>, blocks: VisualBlock[], bounds: RelativeBounds, color: string) {
  const highlights = [];

  const { start, end } = selection;

  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };

  for (let i = start.blockI; i <= end.blockI; i++) {
    const block = blocks[i];
    const isStartBlock = i === start.blockI;
    for (let j = isStartBlock ? start.lineI : 0; j < block.lines.length; j++) {
      const line = block.lines[j];
      const isStartLine = j === start.lineI;
      for (
        let k = isStartLine && isStartBlock ? start.spanI : 0;
        k < line.spans.length;
        k++
      ) {
        const isStart = isStartBlock && isStartLine && k === start.spanI;
        const isEnd = i === end.blockI && j === end.lineI && k === end.spanI;

        let { x, width } = genSeg(selection, line.spans[k], isStart, isEnd);
        x += bounds.x + line.x;
        const y = bounds.y + + line.y + block.y;
        const rel = { x, y, width, height: line.height };

        highlights.push(
          <path
            key={[i, j, k].join("|")}
            d={expandToPath({ ...bounds, ...rel, origin: center })}
            fill={color}
          />,
        );

        if (isEnd) return highlights;
      }
    }
  }

  return highlights;
}

function Highlight({ color }: HighlightProps) {
  const selection = useEditorStore(state => state.visualSelection);

  const { selected } = useEditorStore.getState();
  const { components } = useVisualScene.getState();
  const { blocks, bounds } = components[selected!].document;

  if (!isValidSelection(selection, blocks)) return null;

  const normd = normalizeSelectionVisual(selection) as Definite<VisualSelection>;

  const highlights = genSegs(normd, blocks, bounds, color);

  return <>{highlights}</>;
}

export default Highlight;
