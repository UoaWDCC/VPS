import { render } from "../../../../components/ContextMenu/portal";
import useEditorStore from "../../stores/editor";
import type { Vec2 } from "../../types";
import ComponentMenu from "./ComponentContext";

export function handleContextGlobal(e: React.MouseEvent, position: Vec2) {
  const target = e.target as HTMLElement;

  if (target.dataset.id) {
    handleComponentContext(e, position);
  }
}

function handleComponentContext(e: React.MouseEvent, _: Vec2) {
  const { selected } = useEditorStore.getState();

  e.preventDefault();
  render({
    menu: ComponentMenu(selected),
    position: { x: e.clientX, y: e.clientY },
  });
}
