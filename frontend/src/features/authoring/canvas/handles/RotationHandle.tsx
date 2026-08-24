import { getBoxCenter, rotate } from "../../util";
import useEditorStore from "../../stores/editor";
import { getSelectedComponentBounds } from "../../handlers/pointer/pointer";
import { HANDLE_RADIUS } from "../../../../util/canvas";

const RotationHandle = () => {
  const mode = useEditorStore((s) => s.mode);

  const bounds = getSelectedComponentBounds();
  if (!bounds) return null;
  const center = getBoxCenter(bounds.verts);

  const y = Math.min(bounds.verts[0].y, bounds.verts[1].y);

  const initial = rotate({ x: center.x, y }, center, bounds.rotation);
  const point = rotate({ x: center.x, y: y - 40 }, center, bounds.rotation);

  return (
    <g
      pointerEvents={mode.includes("mutation") ? "none" : "auto"}
      style={{ cursor: "crosshair" }}
    >
      <line
        x1={initial.x}
        y1={initial.y}
        x2={point.x}
        y2={point.y}
        strokeWidth={3}
        stroke="blue"
      />
      <ellipse
        data-handle
        data-type="rotation"
        data-coords={[0, 0]}
        cx={point.x}
        cy={point.y}
        rx={HANDLE_RADIUS}
        ry={HANDLE_RADIUS}
        fill="blue"
      />
    </g>
  );
};

export default RotationHandle;
