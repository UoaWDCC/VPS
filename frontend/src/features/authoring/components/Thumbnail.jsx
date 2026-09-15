import Box from "../elements/Box";
import Ellipse from "../elements/Ellipse";
import Image from "../elements/Image";
import Line from "../elements/Line";
import Speech from "../elements/Speech";
import TextBox from "../elements/TextBox";
import { buildVisualComponents } from "../pipeline";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../../../util/canvas";
import Background from "../elements/Background";

const componentMap = {
  textbox: TextBox,
  speech: Speech,
  ellipse: Ellipse,
  box: Box,
  image: Image,
  line: Line,
};

function resolve(component) {
  const Fc = componentMap[component.type];
  if (Fc) return <Fc key={component.id} {...component} />;
  return null;
}

const Thumbnail = ({ components, background }) => {
  const visual = buildVisualComponents(components);
  const visualComponents = visual
    .sort((a, b) => a.zIndex - b.zIndex)
    .map(resolve);

  return (
    <svg
      className="w-full h-full"
      viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
    >
      <rect
        x="0"
        y="0"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        fill="var(--color-canvas)"
      />
      <Background background={background ?? null} />
      {visualComponents}
    </svg>
  );
};

export default Thumbnail;
