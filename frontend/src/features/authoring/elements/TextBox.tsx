import Text from "../text/Text";
import type { TextBoxComponent } from "../types";
import Box from "./Box";

interface TextBoxProps extends TextBoxComponent {
  editable: boolean;
}

function TextBox(props: TextBoxProps) {
  return (
    <g>
      <Box {...props} type="box" />
      <Text doc={props.document} editable={props.editable} />
    </g>
  );
}

export default TextBox;
