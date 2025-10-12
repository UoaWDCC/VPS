import {
  constructPath,
  expandBoxVerts,
  filterComponent,
  getBoxCenter,
  rotateMany,
} from "../util";
import type { BoxComponent } from "../types";

function Box(component: BoxComponent) {
  const { bounds } = component;

  const verts = rotateMany(
    expandBoxVerts(bounds.verts),
    getBoxCenter(bounds.verts),
    bounds.rotation
  );
  const path = constructPath(verts);

  return <path d={path} {...filterComponent(component)} />;
}

export default Box;
