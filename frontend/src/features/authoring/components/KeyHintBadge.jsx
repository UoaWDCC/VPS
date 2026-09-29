import { expandBoxVerts, getBoxCenter, rotateMany } from "../util";
import { displayKeyBinding } from "../keyBindings";
import { DEFAULT_KEY_HINT_POSITION } from "../keyHintPosition";

const FONT_SIZE = 26;
const PADDING_X = 10;
const PADDING_Y = 6;
const INSET = 10;

// Small, subtle "[KEY]" badge so it stays legible over arbitrary video
// backgrounds regardless of app theme. Anchored to one of six positions
// around the component's (rotated) bounding box.
function rectFor(position, corners, width, height) {
  const [tl, tr, br, bl] = corners;
  const topCenterX = (tl.x + tr.x) / 2;
  const bottomCenterX = (bl.x + br.x) / 2;

  switch (position) {
    case "topLeft":
      return { x: tl.x + INSET, y: tl.y + INSET };
    case "topCenter":
      return { x: topCenterX - width / 2, y: tl.y + INSET };
    case "bottomLeft":
      return { x: bl.x + INSET, y: bl.y - height - INSET };
    case "bottomCenter":
      return { x: bottomCenterX - width / 2, y: bl.y - height - INSET };
    case "bottomRight":
      return { x: br.x - width - INSET, y: br.y - height - INSET };
    case "topRight":
    default:
      return { x: tr.x - width - INSET, y: tr.y + INSET };
  }
}

export default function KeyHintBadge({
  bounds,
  keyBinding,
  position = DEFAULT_KEY_HINT_POSITION,
}) {
  const corners = rotateMany(
    expandBoxVerts(bounds.verts),
    getBoxCenter(bounds.verts),
    bounds.rotation
  );
  const label = `[${displayKeyBinding(keyBinding)}]`;
  const width = label.length * FONT_SIZE * 0.6 + PADDING_X * 2;
  const height = FONT_SIZE + PADDING_Y * 2;
  const { x, y } = rectFor(position, corners, width, height);

  return (
    <g className="pointer-events-none" opacity={0.75}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill="#000000"
        opacity={0.55}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={FONT_SIZE}
        fontFamily="monospace"
        fill="#ffffff"
      >
        {label}
      </text>
    </g>
  );
}
