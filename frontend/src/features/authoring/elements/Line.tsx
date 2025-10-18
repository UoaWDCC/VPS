import { constructPath, filterComponent } from "../util";
import type { LineComponent } from "../types";

function Line(component: LineComponent) {
  const { bounds } = component;

  const path = constructPath(bounds.verts);

  return <path d={path} {...filterComponent(component)} />;
}

export default Line;
