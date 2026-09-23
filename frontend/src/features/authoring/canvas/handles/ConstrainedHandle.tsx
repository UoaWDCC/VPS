import { getBoxCenter, mutate, rotate, subtract } from "../../util";
import useEditorStore from "../../stores/editor";
import { getSelectedComponentBounds } from "../../handlers/pointer/pointer";
import { getCoordsVec } from "../../handlers/pointer/resize";
import { HANDLE_RADIUS } from "../../../../util/canvas";
import type { Vec2 } from "../../types";

interface Props {
  x: number;
  y: number;
}

const RESIZE_CURSORS = ["ns-resize", "nesw-resize", "ew-resize", "nwse-resize"];

// picks the resize cursor matching this handle's visual direction
function getResizeCursor(
  localPoint: Vec2,
  center: Vec2,
  x: number,
  y: number,
  rotation: number
) {
  // ignore speech-bubble tail
  if (x === 2 || y === 2) return "crosshair";

  // use the sign only, not the magnitude
  const { x: dx, y: dy } = mutate(subtract(localPoint, center), Math.sign);
  const baseAngle = Math.atan2(dx, -dy) * (180 / Math.PI);
  const angle = (((baseAngle + rotation) % 360) + 360) % 360;
  return RESIZE_CURSORS[Math.round(angle / 45) % 4];
}

const ResizeHandle = ({ x, y }: Props) => {
  const mode = useEditorStore((s) => s.mode);

  const bounds = getSelectedComponentBounds();
  if (!bounds) return null;

  const verts = bounds.verts;
  const center = getBoxCenter(verts);
  const localPoint = getCoordsVec(verts, [x, y]);
  const point = rotate(localPoint, center, bounds.rotation);

  return (
    <g
      pointerEvents={mode.includes("mutation") ? "none" : "auto"}
      style={{
        cursor: getResizeCursor(localPoint, center, x, y, bounds.rotation),
      }}
    >
      <ellipse
        data-handle
        data-type="size"
        data-coords={[x, y]}
        cx={point.x}
        cy={point.y}
        rx={HANDLE_RADIUS}
        ry={HANDLE_RADIUS}
        fill="blue"
      />
    </g>
  );
};

export default ResizeHandle;
