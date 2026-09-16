import type { PendingImage } from "../stores/editor";
import { getRelativeBounds } from "../util";

// How much the preview is blurred at 0% progress, in canvas units. The blur
// resolves as the upload progresses, so the image "develops" into place.
const MAX_BLUR = 24;
const LABEL_FONT_SIZE = 20;
const LABEL_PADDING = 12;

// Drawn in place of an image while its file is uploading. Purely visual —
// placeholders never enter the scene model, so they are not saved or undoable.
function ImagePlaceholder({
  id,
  bounds,
  previewUrl,
  progress,
  settled,
}: PendingImage) {
  const { x, y, width, height } = getRelativeBounds(bounds.verts);

  const blur = settled ? 0 : MAX_BLUR * (1 - progress);
  const percent = Math.round((settled ? 1 : progress) * 100);
  const label = `Uploading… ${percent}%`;

  // rough, but text metrics are not worth a measuring pass here
  const labelWidth = label.length * LABEL_FONT_SIZE * 0.55 + LABEL_PADDING * 2;
  const labelHeight = LABEL_FONT_SIZE + LABEL_PADDING;
  const centre = { x: x + width / 2, y: y + height / 2 };

  return (
    <g className="pointer-events-none">
      <defs>
        {/* keeps the blur from bleeding outside the image bounds */}
        <clipPath id={`placeholder-clip-${id}`}>
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>

      <image
        x={x}
        y={y}
        width={width}
        height={height}
        href={previewUrl}
        preserveAspectRatio="none"
        clipPath={`url(#placeholder-clip-${id})`}
        style={{
          filter: `blur(${blur}px)`,
          transition: "filter 250ms ease-out",
        }}
      />

      <g
        style={{
          opacity: settled ? 0 : 1,
          transition: "opacity 250ms ease-out",
        }}
      >
        {/* outline, so a pale image still reads as a distinct object */}
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="none"
          stroke="var(--color-backdrop-content)"
          strokeWidth={2}
          strokeDasharray="8 6"
          opacity={0.6}
        />
        <rect
          x={centre.x - labelWidth / 2}
          y={centre.y - labelHeight / 2}
          width={labelWidth}
          height={labelHeight}
          rx={labelHeight / 2}
          fill="var(--color-backdrop)"
          opacity={0.85}
        />
        <text
          x={centre.x}
          y={centre.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={LABEL_FONT_SIZE}
          fill="var(--color-backdrop-content)"
        >
          {label}
        </text>
      </g>
    </g>
  );
}

export default ImagePlaceholder;
