import { getBoxCenter, rotate } from "../../util";
import useEditorStore from "../../stores/editor";
import { getSelectedComponentBounds } from "../../handlers/pointer/pointer";

interface Props {
  x: number;
  y: number;
}

const ResizeHandle = ({ x, y }: Props) => {
  const mode = useEditorStore((s) => s.mode);

  const componentBounds = getSelectedComponentBounds();
  const componentVerts = componentBounds.verts;
  const componentRotation = componentBounds.rotation;

  let point = {
    x:
      x === 0.5
        ? (componentVerts[0].x + componentVerts[1].x) / 2
        : componentVerts[x].x,
    y:
      y === 0.5
        ? (componentVerts[0].y + componentVerts[1].y) / 2
        : componentVerts[y].y,
  };

  point = rotate(point, getBoxCenter(componentVerts), componentRotation);

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
