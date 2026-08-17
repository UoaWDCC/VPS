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
  const target = e.target as HTMLElement;
  const id = target.dataset.id as string;
  const { selected, setSelected } = useEditorStore.getState();
  const ids = selected.includes(id) ? selected : [id];

  if (ids !== selected) setSelected(ids);

  e.preventDefault();
  render({
    menu: ComponentMenu({ ids }),
    position: { x: e.clientX, y: e.clientY },
  });
}
