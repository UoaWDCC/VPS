import Box from "../elements/Box";
import Ellipse from "../elements/Ellipse";
import Image from "../elements/Image";
import Line from "../elements/Line";
import Speech from "../elements/Speech";
import TextBox from "../elements/TextBox";
import { buildVisualComponents, buildVisualScene } from "../pipeline";

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

const Thumbnail = ({ components }) => {
  const visual = buildVisualComponents(components);
  const visualComponents = visual
    .sort((a, b) => a.zIndex - b.zIndex)
    .map(resolve);

  return (
    <svg viewBox="0 0 1920 1080">
      <rect x="0" y="0" width="1920" height="1080" fill="white" />
      {visualComponents}
    </svg>
  );
};

export default Thumbnail;
