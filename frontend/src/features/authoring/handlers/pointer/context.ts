import { render } from "../../../../components/ContextMenu/portal";
import useEditorStore from "../../stores/editor";
import ComponentMenu from "./ComponentContext";

export function handleContextGlobal(e: React.MouseEvent) {
  const target = e.target as HTMLElement;

  if (target.dataset.id) {
    handleComponentContext(e);
  }
}

function handleComponentContext(e: React.MouseEvent) {
  const { selected } = useEditorStore.getState();

  e.preventDefault();
  render({
    menu: ComponentMenu({ ids: selected }),
    position: { x: e.clientX, y: e.clientY },
  });
}
