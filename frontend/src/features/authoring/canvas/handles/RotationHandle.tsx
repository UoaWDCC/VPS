import { getBoxCenter, rotate } from "../../util";
import useEditorStore from "../../stores/editor";
import useVisualScene from "../../stores/visual";
import { getSelectedComponentBounds } from "../../handlers/pointer/pointer";

const RotationHandle = () => {
  const { mode } = useEditorStore.getState();

  const bounds = getSelectedComponentBounds();
  const verts = bounds.verts;
  const componentRotation = bounds.rotation;

  const center = getBoxCenter(bounds.verts);

  const y = Math.min(verts[0].y, verts[1].y);

  const initial = rotate({ x: center.x, y }, center, componentRotation);
  const point = rotate({ x: center.x, y: y - 40 }, center, componentRotation);

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
        rx={7}
        ry={7}
        fill="blue"
      />
    </g>
  );
};

export default RotationHandle;
