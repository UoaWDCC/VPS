import Text from "../text/Text";
import type { TextBoxComponent } from "../types";
import Box from "./Box";

interface TextBoxProps extends TextBoxComponent {
  editable: boolean;
}


function TextBox(props: TextBoxProps) {
  function handleDoubleClick(e: React.MouseEvent) {
    const rect = e.currentTarget.querySelector('[data-type="document"]') as HTMLElement;
    if (!rect) return;
    rect.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: e.clientX, clientY: e.clientY }));
  }

  return (
    <g onDoubleClick={handleDoubleClick}>
      <Box {...props} type="box" />
      <Text doc={props.document} editable={props.editable} />
    </g>
  );
}

export default TextBox;
