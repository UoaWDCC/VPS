import { getBoxCenter, rotate } from "../../util";
import useEditorStore from "../../stores/editor";
import { getSelectedComponentBounds } from "../../handlers/pointer/pointer";

const RotationHandle = () => {
  const mode = useEditorStore((s) => s.mode);

  const componentBounds = getSelectedComponentBounds();
  const componentVerts = componentBounds.verts;
  const componentRotation = componentBounds.rotation;

  const componentCenter = getBoxCenter(componentBounds.verts);

  const y = Math.min(componentVerts[0].y, componentVerts[1].y);

  const initial = rotate(
    { x: componentCenter.x, y },
    componentCenter,
    componentRotation
  );
  const point = rotate(
    { x: componentCenter.x, y: y - 40 },
    componentCenter,
    componentRotation
  );

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
