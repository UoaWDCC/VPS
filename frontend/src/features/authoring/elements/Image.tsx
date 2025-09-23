import type { ImageComponent } from "../types";
import { filterComponent, getRelativeBounds, mutate, subtract } from "../util";

function Image(component: ImageComponent) {
  const { bounds } = component;

  const relative = getRelativeBounds(bounds.verts);
  const scale = mutate(
    subtract(bounds.verts[1], bounds.verts[0]),
    (val) => val / Math.abs(val),
  );

  const transform = `translate(${relative.x + relative.width / 2},${relative.y + relative.height / 2}) rotate(${bounds.rotation}) scale(${scale.x},${scale.y})`;

  return (
    <image
      x={-relative.width / 2}
      y={-relative.height / 2}
      width={relative.width}
      height={relative.height}
      transform={transform}
      {...filterComponent(component)}
    />
  );
}

export default Image;
