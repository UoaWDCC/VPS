import Text from "../text/Text";
import { modifyComponentProp } from "../scene/operations/component";
import type { ShapeComponent } from "../types";

export function addText(WrappedComponent: ShapeComponent) {
  return function TextableShape(props: ShapeComponent) {
    function handleDoubleClick(e: React.MouseEvent) {
      if (!props.document) {
        modifyComponentProp(props.id, "document", {
          style: {},
          blocks: [
            {
              style: {},
              spans: [
                {
                  style: {},
                  text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla venenatis.",
                },
              ],
            },
          ],
        });
      }
      const rect = e.currentTarget.querySelector(
        '[data-type="document"]'
      ) as HTMLElement;
      if (!rect) return;
      rect.dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          clientX: e.clientX,
          clientY: e.clientY,
        })
      );
    }

    return (
      <g onDoubleClick={handleDoubleClick}>
        <WrappedComponent {...props} />
        {props.document && <Text doc={props.document} editable={true} />}
      </g>
    );
  };
}
