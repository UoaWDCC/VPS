import type { VisualDocument } from "./types";
import { expandToPath } from "../util";

function TextHighlight({ doc }: { doc: VisualDocument }) {
  const { bounds, blocks } = doc;
  const origin = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };

  const highlights = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    for (let j = 0; j < block.lines.length; j++) {
      const line = block.lines[j];
      for (let k = 0; k < line.spans.length; k++) {
        const span = line.spans[k];
        if (!span.highlightColor) continue;

        highlights.push(
          <path
            key={[i, j, k].join("|")}
            d={expandToPath({
              x: bounds.x + line.x + span.x,
              y: bounds.y + block.y + line.y,
              width: span.width,
              height: line.height,
              rotation: bounds.rotation,
              origin,
            })}
            fill={span.highlightColor}
            pointerEvents="none"
          />
        );
      }
    }
  }

  return <>{highlights}</>;
}

export default TextHighlight;

