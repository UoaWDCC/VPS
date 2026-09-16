import type { VisualDocument } from "./types";
import Cursor from "./Cursor.tsx";
import Highlight from "./Highlight";
import Rectangle from "../canvas/Rectangle";
import { buildStyle } from "./build";
import useEditorStore from "../stores/editor";
import TextHighlight from "./TextHighlight.tsx";
import { CHIP_FONT_SCALE } from "./property.ts";
import PropertyChips from "./PropertyChips";

function buildGroups(doc: VisualDocument) {
  return doc.blocks.map((block, i) => (
    <g key={i}>
      {block.lines.map((line, j) => (
        <text
          key={j}
          x={line.x}
          y={block.y + line.y + line.baseline}
          style={{ whiteSpace: "pre" }}
        >
          {line.spans.map((span, k) => {
            const { property } = span;
            const style = buildStyle(
              property
                ? {
                    ...span.style,
                    fontSize: span.style.fontSize * CHIP_FONT_SCALE,
                  }
                : span.style
            );
            if (property?.missing)
              style.fill = "var(--color-chip-missing-text)";

            //center text within chip
            return property ? (
              <tspan
                key={k}
                x={line.x + span.x + span.width / 2}
                y={block.y + line.y + line.height / 2}
                textAnchor="middle"
                dominantBaseline="central"
                style={style}
              >
                {property.displayName}
              </tspan>
            ) : (
              <tspan
                key={k}
                x={line.x + span.x}
                y={block.y + line.y + line.baseline}
                style={style}
              >
                {span.text}
              </tspan>
            );
          })}
        </text>
      ))}
    </g>
  ));
}

function Text({ doc, editable }: { doc: VisualDocument; editable?: boolean }) {
  const selected = useEditorStore((state) =>
    editable ? state.selected : null
  );

  const isSelected = editable && selected && selected[0] === doc.id;

  const { bounds } = doc;
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };

  const transformation = `translate(${bounds.x + bounds.width / 2},${bounds.y + bounds.height / 2}) rotate(${bounds.rotation}) translate(${-bounds.width / 2},${-bounds.height / 2})`;

  const selectionArea = {
    verts: [
      { x: bounds.x, y: bounds.y },
      {
        y:
          bounds.y +
          doc.blocks[doc.blocks.length - 1].y +
          doc.blocks[doc.blocks.length - 1].height,
        x: bounds.x + bounds.width,
      },
    ],
    rotation: bounds.rotation,
  };

  return (
    <g className="select-none text">
      <TextHighlight doc={doc} />
      <PropertyChips doc={doc} />
      {isSelected && (
        <Highlight color="var(--color-selection)" bounds={bounds} />
      )}
      <g className="select-none" transform={transformation}>
        {buildGroups(doc)}
      </g>
      {isSelected && <Cursor bounds={bounds} />}
      <Rectangle
        bounds={selectionArea}
        rotationOrigin={center}
        opacity={0}
        data-type="document"
        data-id={doc.id}
      />
    </g>
  );
}

export default Text;
