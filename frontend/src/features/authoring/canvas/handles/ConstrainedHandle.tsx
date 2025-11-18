import { getBoxCenter, rotate } from "../../util";
import useEditorStore from "../../stores/editor";
import useVisualScene from "../../stores/visual";

interface Props {
  x: number;
  y: number;
}

const ResizeHandle = ({ x, y }: Props) => {
  const selected = useEditorStore((state) => state.selected)!;
  const mode = useEditorStore((state) => state.mode);
  const scene = useVisualScene((scene) => scene.components);

  const bounds = scene[selected].bounds;
  const verts = bounds.verts;

  let point = {
    x: x === 0.5 ? (verts[0].x + verts[1].x) / 2 : verts[x].x,
    y: y === 0.5 ? (verts[0].y + verts[1].y) / 2 : verts[y].y,
  };

  point = rotate(point, getBoxCenter(verts), bounds.rotation);

  return (
    <g
      pointerEvents={mode.includes("mutation") ? "none" : "auto"}
      style={{ cursor: "crosshair" }}
    >
      <ellipse
        data-handle
        data-type="size"
        data-coords={[x, y]}
        cx={point.x}
        cy={point.y}
        rx={7}
        ry={7}
        fill="blue"
      />
    </g>
  );
};

export default ResizeHandle;
