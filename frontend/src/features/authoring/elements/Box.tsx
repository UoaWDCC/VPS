//change box creation tool to be textbox and then have it be predefined filled and then beyond that 
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
  return <path className="box" d={path} {...filterComponent(component)} />;
}

export default Box;
