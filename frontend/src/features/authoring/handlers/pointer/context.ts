import { render } from "../../../../components/ContextMenu/portal";
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

  e.preventDefault();
  render({
    menu: ComponentMenu({ id }),
    position: { x: e.clientX, y: e.clientY },
  });
}
