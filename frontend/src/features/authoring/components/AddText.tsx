import Text from "../text/Text";
import { modifyComponentProp } from "../scene/operations/component";
import type { ShapeComponent } from "../types";
import useEditorStore from "../stores/editor";

export function addText(WrappedComponent: ShapeComponent) {
  return function TextableShape(props: ShapeComponent) {
    function handleDoubleClick(e: React.MouseEvent) {
      const mode = useEditorStore.getState().mode;
      if (mode.includes("text")) return;
      const target = e.currentTarget as SVGGElement;
      const { clientX, clientY } = e;
      if (!props.document) {
        modifyComponentProp([props.id], "document", {
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
        requestAnimationFrame(() => {
          const rect = target.querySelector<HTMLElement>(
            '[data-type="document"]'
          );
          rect?.dispatchEvent(
            new MouseEvent("mousedown", {
              bubbles: true,
              clientX,
              clientY,
            })
          );
          rect?.dispatchEvent(
            new MouseEvent("mouseup", {
              bubbles: true,
              clientX,
              clientY,
            })
          );
        });
        return;
      }
      const rect = target.querySelector(
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
      rect?.dispatchEvent(
        new MouseEvent("mouseup", {
          bubbles: true,
          clientX,
          clientY,
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
