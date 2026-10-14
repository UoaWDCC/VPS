import type { VisualDocument } from "./types";

const CHIP_Y_SCALE = 1.25;

//shared logic from text highlight
function PropertyChips({ doc }: { doc: VisualDocument }) {
  const { bounds, blocks } = doc;
  const origin = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };

  const chips = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    for (let j = 0; j < block.lines.length; j++) {
      const line = block.lines[j];
      for (let k = 0; k < line.spans.length; k++) {
        const span = line.spans[k];
        if (!span.property) continue;

        //clamp chip height to avoid overlap, set text at center
        const height = Math.min(
          span.style.fontSize * CHIP_Y_SCALE,
          line.height
        );
        const y = bounds.y + block.y + line.y + (line.height - height) / 2;

        //rotation transform independent from text
        //colour changes for missing property
        chips.push(
          <g
            key={[i, j, k].join("|")}
            transform={`rotate(${bounds.rotation} ${origin.x} ${origin.y})`}
            pointerEvents="none"
          >
            <rect
              x={bounds.x + line.x + span.x}
              y={y}
              width={span.width}
              height={height}
              rx={height / 2}
              fill={
                span.property.missing
                  ? "var(--color-chip-missing)"
                  : "var(--color-chip)"
              }
            />
          </g>
        );
      }
    }
  }

  return <>{chips}</>;
}

export default PropertyChips;
