import Text from "../text/Text";
import type { TextBoxComponent } from "../types";
import Box from "./Box";

function TextBox(component: TextBoxComponent) {
  return (
    <g>
      <Box {...component} type="box" />
      <Text {...component.document} />
    </g>
  );
}

export default TextBox;
