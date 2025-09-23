import { getBoxCenter, rotate } from "../../util";
import useEditorStore from "../../stores/editor";
import useVisualScene from "../../stores/visual";

const RotationHandle = () => {
  const selected = useEditorStore(state => state.selected)!;
  const scene = useVisualScene(scene => scene.components);
  const mode = useEditorStore(state => state.mode);

  const bounds = scene[selected].bounds;
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
        strokeWidth={2}
        stroke="blue"
      />
      <ellipse data-handle data-type="rotation" data-coords={[0, 0]} cx={point.x} cy={point.y} rx={5} ry={5} fill="blue" />
    </g>
  );
};

export default RotationHandle;
