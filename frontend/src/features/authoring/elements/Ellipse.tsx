import type { EllipseComponent } from "../types";
import { filterComponent, getBoxCenter, mutate, rotateMany, subtract } from "../util";

function Ellipse(component: EllipseComponent) {
  const bounds = component.bounds;
  const { verts } = bounds;

  const center = getBoxCenter(verts);
  const radius = mutate(subtract(center, verts[0]), Math.abs);
  let anchors = [
    { x: verts[0].x, y: center.y },
    { x: verts[1].x, y: center.y },
  ];
  anchors = rotateMany(anchors, center, bounds.rotation);

  const d = [
    `M${anchors[0].x} ${anchors[0].y}`,
    `A${radius.x} ${radius.y} ${bounds.rotation} 1 1 ${anchors[1].x} ${anchors[1].y}`,
    `A${radius.x} ${radius.y} ${bounds.rotation} 1 1 ${anchors[0].x} ${anchors[0].y}`,
  ].join(" ");

  return <path d={d} {...filterComponent(component)} />;
}

export default Ellipse;
