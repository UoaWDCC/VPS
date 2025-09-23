import type { Bounds, Vec2 } from "../types";
import { constructPath, expandBoxVerts, rotateMany } from "../util";

interface RectangleProps extends React.SVGProps<SVGPathElement> {
  bounds: Bounds;
  rotationOrigin?: Vec2;
}

function Rectangle({ bounds, rotationOrigin, ...rest }: RectangleProps) {
  let verts = expandBoxVerts(bounds.verts);
  if (rotationOrigin)
    verts = rotateMany(verts, rotationOrigin, bounds.rotation);
  const path = constructPath(verts);

  return <path d={path} {...rest} />;
}

export default Rectangle;
