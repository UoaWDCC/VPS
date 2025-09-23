import { modifyComponentBounds } from "../../scene/operations/component";
import useEditorStore from "../../stores/editor";
import useVisualScene from "../../stores/visual";
import { getRelativePosition, parseHit, syncModelSelection } from "../../text/cursor";
import type { Vec2 } from "../../types";
import { subtract, translate } from "../../util";
import { handleCreateDrag, handleCreateEnd, handleCreateStart } from "./create";
import { handleResizeDrag, handleResizeStart } from "./resize";

export function handleMouseDownGlobal(e: React.MouseEvent, position: Vec2) {
    const target = e.target as HTMLElement;

    const { mode, setVisualSelection, setSelection } = useEditorStore.getState();

    if (mode.includes("create")) {
        handleCreateStart(e, position);
    } else if (target.dataset.handle) {
        handleResizeStart(e);
    } else if (target.dataset.type === "document") {
        handleDocumentClick(e, position);
    } else if (target.dataset.id) {
        handleComponentClick(e, position);
    } else {
        handleCanvasClick();
    }

    if (target.dataset.type !== "document") {
        setVisualSelection({ start: null, end: null });
        setSelection({ start: null, end: null });
    }

    useEditorStore.getState().setMouseDown(true);
}

export function handleMouseMoveGlobal(e: React.MouseEvent, position: Vec2) {
    const { mode, mouseDown } = useEditorStore.getState();

    if (!mouseDown) return;

    if (mode.includes("resize")) {
        handleResizeDrag(e, position);
    } else if (mode.includes("text")) {
        handleTextSelection(e, position);
    } else if (mode.includes("create")) {
        handleCreateDrag(e, position);
    } else {
        handleComponentDrag(e, position);
    }
}

export function handleMouseUpGlobal() {
    const { mode, setMouseDown } = useEditorStore.getState();

    if (mode.includes("text")) {
        syncModelSelection();
    } else if (mode.includes("create")) {
        handleCreateEnd();
    } else if (mode.includes("mutation")) {
        handleMutationEnd();
    }

    setMouseDown(false);
}

function handleCanvasClick() {
    const { setSelected, setMode } = useEditorStore.getState();
    setSelected(null);
    setMode(["normal"]);
}

// component handlers

function handleComponentClick(e: React.MouseEvent, position: Vec2) {
    const { setSelected, setOffset, setMode, setMutationBounds } = useEditorStore.getState();
    const scene = useVisualScene.getState().components;

    const target = e.target as HTMLElement;

    setOffset(position);
    setSelected(target.dataset.id as string);

    const component = scene[target.dataset.id as string];
    setMutationBounds({ ...component.bounds })

    setMode(["normal"]);
}

function handleComponentDrag(_: React.MouseEvent, position: Vec2) {
    const { selected, setMutationBounds, offset, setMode } = useEditorStore.getState();
    if (!selected) return;

    const component = useVisualScene.getState().components[selected];

    const verts = translate(component.bounds.verts, subtract(position, offset));
    setMutationBounds((prev) => ({ ...prev, verts }));
    setMode(["mutation"]);
}

function handleMutationEnd() {
    const { selected, mutationBounds, setMode } = useEditorStore.getState();
    modifyComponentBounds(selected!, mutationBounds);
    setMode(["normal"]);
}

// document handlers

function handleDocumentClick(e: React.MouseEvent, position: Vec2) {
    const { setSelected, setMode, setMutationBounds, setVisualSelection, setDesiredColumn } = useEditorStore.getState();
    const scene = useVisualScene.getState().components;

    const target = e.target as HTMLElement;
    const { document: doc } = useVisualScene.getState().components[target.dataset.id as string];
    const cursor = parseHit(getRelativePosition(position, doc.bounds), doc.blocks);

    setSelected(target.dataset.id as string);
    setMode(["text"]);

    const component = scene[target.dataset.id as string];
    setMutationBounds({ ...component.bounds })

    setDesiredColumn(null);
    setVisualSelection({ start: cursor, end: null });
    syncModelSelection();
}

function handleTextSelection(_: React.MouseEvent, position: Vec2) {
    const { selected, setVisualSelection } = useEditorStore.getState();
    const { document: doc } = useVisualScene.getState().components[selected!];
    const cursor = parseHit(getRelativePosition(position, doc.bounds), doc.blocks);
    setVisualSelection(prev => ({ start: prev.start, end: cursor }));
}
