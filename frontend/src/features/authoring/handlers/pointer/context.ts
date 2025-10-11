import { render } from "../../../../components/ContextMenu/portal";
import type { Vec2 } from "../../types";
import ComponentMenu from "./ComponentContext";

export function handleContextGlobal(e: React.MouseEvent, position: Vec2) {
    const target = e.target as HTMLElement;

    if (target.dataset.id) {
        handleComponentContext(e, position);
    }
}

function handleComponentContext(e: React.MouseEvent, _: Vec2) {
    const target = e.target as HTMLElement;
    const id = target.dataset.id as string;

    e.preventDefault();
    render({ menu: ComponentMenu({ id }), position: { x: e.clientX, y: e.clientY } });
}
