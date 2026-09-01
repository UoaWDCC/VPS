import type { MarkerSelection, VisualBlock, VisualDocument } from "./types";
import Cursor from "./Cursor.tsx";
import Highlight from "./Highlight";
import Rectangle from "../canvas/Rectangle";
import { buildStyle, scriptShift, LIST_MARKER_GAP } from "./build";
import useEditorStore from "../stores/editor";
import TextHighlight from "./TextHighlight.tsx";

const CHECKBOX_SCALE = 0.8;
const CHECKBOX_HIT_PADDING = 4;
const MARKER_HIT_PADDING = 6;

// bullet markers cycle through progressively "lighter" glyphs as they
// nest; the dash marker stays "-" at every level
const BULLET_GLYPHS = ["•", "◦", "▪"];

// marker geometry shared between the visible glyph and its (separately
// painted, see buildMarkerHit) click target
function markerGeometry(block: VisualBlock) {
  // a soft-break continuation shares its list's indent but draws no marker
  if (!block.list || block.lines.length === 0 || block.softBreak) return null;

  const firstLine = block.lines[0];
  // match the marker to how the first character actually renders (its real
  // font size/color), not the block's own default -- span-level overrides
  // (e.g. selecting the bullet's text and bumping font size) don't touch
  // block.style, so that would leave the marker stuck at the old size
  const style = firstLine.spans[0]?.style ?? block.style;

  const baseline = block.y + firstLine.y + firstLine.baseline;
  // anchor to the line's actual start (which already accounts for
  // indent + alignment) so the marker tracks the text instead of always
  // sitting at the block's fixed left edge
  const markerX = firstLine.x - LIST_MARKER_GAP;

  return { list: block.list, style, baseline, markerX };
}

// tightly wraps the glyph/checkbox itself, drawn first so it stays legible
// on top -- deliberately snugger than the (generously padded, for easy
// clicking) hit target below, so selection only highlights the character
// and not the empty margin around it
const HIGHLIGHT_PADDING = 2;

function buildMarkerSelectionHighlight(
  markerStyle: "checkbox" | "dash" | "bullet",
  style: { fontSize: number },
  baseline: number,
  markerX: number
) {
  if (markerStyle === "checkbox") {
    const size = style.fontSize * CHECKBOX_SCALE;
    const boxX = markerX - size;
    const boxY = baseline - size;
    return (
      <rect
        x={boxX - HIGHLIGHT_PADDING}
        y={boxY - HIGHLIGHT_PADDING}
        width={size + HIGHLIGHT_PADDING * 2}
        height={size + HIGHLIGHT_PADDING * 2}
        rx={2}
        fill="var(--color-selection)"
      />
    );
  }

  const width = style.fontSize * 0.6;
  const height = style.fontSize * 0.75;
  return (
    <rect
      x={markerX - width - HIGHLIGHT_PADDING}
      y={baseline - height - HIGHLIGHT_PADDING}
      width={width + HIGHLIGHT_PADDING * 2}
      height={height + HIGHLIGHT_PADDING * 2}
      rx={2}
      fill="var(--color-selection)"
    />
  );
}

// the visible glyph/checkbox -- safe to paint in normal document order
// since it's purely cosmetic (see buildMarkerHit for the separately
// layered interactive click target)
function buildMarker(block: VisualBlock, isMarkerSelected: boolean) {
  const geometry = markerGeometry(block);
  if (!geometry) return null;
  const { list, style, baseline, markerX } = geometry;

  if (list.markerStyle === "checkbox") {
    const size = style.fontSize * CHECKBOX_SCALE;
    const boxX = markerX - size;
    const boxY = baseline - size;

    return (
      <g key="marker">
        {isMarkerSelected &&
          buildMarkerSelectionHighlight(
            list.markerStyle,
            style,
            baseline,
            markerX
          )}
        <rect
          x={boxX}
          y={boxY}
          width={size}
          height={size}
          rx={2}
          fill="none"
          stroke={style.textColor}
          strokeWidth={1.5}
        />
        {list.checked && (
          <path
            d={`M${boxX + size * 0.2} ${boxY + size * 0.55} L${boxX + size * 0.42} ${boxY + size * 0.78} L${boxX + size * 0.8} ${boxY + size * 0.22}`}
            fill="none"
            stroke={style.textColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </g>
    );
  }

  const glyph =
    list.markerStyle === "bullet"
      ? BULLET_GLYPHS[list.level % BULLET_GLYPHS.length]
      : "-";

  return (
    <g key="marker">
      {isMarkerSelected &&
        buildMarkerSelectionHighlight(
          list.markerStyle,
          style,
          baseline,
          markerX
        )}
      <text
        x={markerX}
        y={baseline}
        textAnchor="end"
        style={{ whiteSpace: "pre", ...buildStyle(style) }}
      >
        {glyph}
      </text>
    </g>
  );
}

// the invisible click target for a marker -- rendered as a separate pass
// *after* the whole-document hit rectangle (see Text()) so it wins hit
// testing at its (small) spot instead of being swallowed by that rectangle,
// which paints on top of everything else in the block by document order
function buildMarkerHit(block: VisualBlock, docId: string, blockIndex: number) {
  const geometry = markerGeometry(block);
  if (!geometry) return null;
  const { list, style, baseline, markerX } = geometry;

  if (list.markerStyle === "checkbox") {
    const size = style.fontSize * CHECKBOX_SCALE;
    const boxX = markerX - size;
    const boxY = baseline - size;

    return (
      <rect
        key={blockIndex}
        x={boxX - CHECKBOX_HIT_PADDING}
        y={boxY - CHECKBOX_HIT_PADDING}
        width={size + CHECKBOX_HIT_PADDING * 2}
        height={size + CHECKBOX_HIT_PADDING * 2}
        fill="transparent"
        style={{ cursor: "pointer" }}
        data-type="checkbox"
        data-id={docId}
        data-block-index={blockIndex}
      />
    );
  }

  const hitSize = style.fontSize + MARKER_HIT_PADDING * 2;

  return (
    <rect
      key={blockIndex}
      x={markerX - hitSize}
      y={baseline - style.fontSize}
      width={hitSize}
      height={hitSize}
      fill="transparent"
      style={{ cursor: "pointer" }}
      data-type="marker"
      data-id={docId}
      data-block-index={blockIndex}
    />
  );
}

function buildGroups(
  doc: VisualDocument,
  markerSelection: MarkerSelection | null
) {
  return doc.blocks.map((block, i) => (
    <g key={i}>
      {buildMarker(
        block,
        markerSelection?.id === doc.id &&
          i >= markerSelection.start &&
          i <= markerSelection.end
      )}
      {block.lines.map((line, j) => {
        // dy is relative to the previous tspan's position, so a super/sub
        // shift has to be undone by the following span's delta -- otherwise
        // the whole rest of the line stays shifted
        let prevShift = 0;
        return (
          <text
            key={j}
            x={line.x}
            y={block.y + line.y + line.baseline}
            style={{ whiteSpace: "pre" }}
          >
            {line.spans.map((span, k) => {
              const shift = scriptShift(span.style);
              const dy = shift - prevShift;
              prevShift = shift;
              return (
                <tspan
                  key={k}
                  dy={dy || undefined}
                  style={buildStyle(span.style)}
                >
                  {span.text}
                </tspan>
              );
            })}
          </text>
        );
      })}
    </g>
  ));
}

function Text({ doc, editable }: { doc: VisualDocument; editable?: boolean }) {
  const selected = useEditorStore((state) =>
    editable ? state.selected : null
  );
  const markerSelection = useEditorStore((state) =>
    editable ? state.markerSelection : null
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
      {isSelected && (
        <Highlight color="var(--color-selection)" bounds={bounds} />
      )}
      <g className="select-none" transform={transformation}>
        {buildGroups(doc, markerSelection)}
      </g>
      {isSelected && <Cursor bounds={bounds} />}
      <Rectangle
        bounds={selectionArea}
        rotationOrigin={center}
        opacity={0}
        data-type="document"
        data-id={doc.id}
      />
      {/* marker/checkbox click targets are interactive only in the
          authoring canvas (editable) -- the play screen has no matching
          click handler, so painting them there would just show a
          misleading pointer cursor with nothing behind it. painted last,
          when present, so they sit on top of (win hit-testing over) the
          document rectangle above, which otherwise covers the whole box
          and would swallow their clicks first */}
      {editable && (
        <g className="select-none" transform={transformation}>
          {doc.blocks.map((block, i) => buildMarkerHit(block, doc.id, i))}
        </g>
      )}
    </g>
  );
}

export default Text;
