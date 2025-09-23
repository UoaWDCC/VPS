import { createBlock, deleteChar, deleteSelection, insertChar, insertSelection } from "../../scene/operations/text";
import useEditorStore from "../../stores/editor";
import useVisualScene from "../../stores/visual";
import { getVisualPosition, goToLineEnd, goToLineStart, moveCursorLine, moveCursorVisual, normalizeSelectionVisual, syncModelSelection, syncVisualCursor } from "../../text/cursor";
import type { VisualBlock, VisualSelection } from "../../text/types";

export function handleTextMode(e: KeyboardEvent) {
    const { selected } = useEditorStore.getState();
    if (!selected) return;

    if (e.key.startsWith("Arrow") || ["Home", "End"].includes(e.key)) {
        handleNavigation(e, selected);
    } else {
        handleEditing(e, selected);
    }
}

function handleEditing(e: KeyboardEvent, selected: string) {
    const { selection, setSelection, setDesiredColumn } = useEditorStore.getState();
    const { start, end } = selection;
    if (!start) return;

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // insert character at cursor
        const newCursor = end
            ? insertSelection(selected, selection, e.key)
            : insertChar(selected, start, e.key);
        setSelection({ start: newCursor, end: null });
    } else if (e.key === "Backspace") {
        // delete character before cursor
        const newCursor = !end
            ? deleteChar(selected, start)
            : deleteSelection(selected, selection);
        setSelection({ start: newCursor, end: null });
    } else if (e.key === "Enter") {
        // create a new block at cursor
        const newCursor = createBlock(selected, start);
        setSelection({ start: newCursor, end });
    } else if (e.key === "Escape") {
        // clear current selection
        setSelection({ start: null, end: null });
    }

    setDesiredColumn(null);
    syncVisualCursor();
}

function handleNavigation(e: KeyboardEvent, selected: string) {
    const { visualSelection, setVisualSelection, setDesiredColumn } = useEditorStore.getState();
    if (!visualSelection.start) return;

    const { blocks } = useVisualScene.getState().components[selected].document;

    const handler = navigationHandlers[e.key];
    if (handler) {
        const cursor = handler(e, visualSelection, blocks);
        if (!["ArrowUp", "ArrowDown"].includes(e.key)) setDesiredColumn(null);
        setVisualSelection(cursor);
        syncModelSelection();
    }
}

const navigationHandlers: Record<string, (...args: Parameters<typeof handleEnd>) => VisualSelection> = {
    ArrowLeft: handleArrowLeft,
    ArrowRight: handleArrowRight,
    ArrowUp: handleArrowUp,
    ArrowDown: handleArrowDown,
    Home: handleHome,
    End: handleEnd,
}

function handleArrowLeft(e: KeyboardEvent, selection: VisualSelection, blocks: VisualBlock[]) {
    const { start, end } = selection;
    if (!e.shiftKey) {
        if (end) {
            const normd = normalizeSelectionVisual(selection);
            return { start: normd.start, end: null };
        } else {
            return { start: moveCursorVisual(blocks, start, -1), end };
        }
    }
    return { start, end: moveCursorVisual(blocks, end ?? start, -1) };
}

function handleArrowRight(e: KeyboardEvent, selection: VisualSelection, blocks: VisualBlock[]) {
    const { start, end } = selection;
    if (!e.shiftKey) {
        if (end) {
            const normd = normalizeSelectionVisual(selection);
            return { start: normd.end, end: null };
        } else {
            return { start: moveCursorVisual(blocks, start, 1), end };
        }
    }
    return { start, end: moveCursorVisual(blocks, end ?? start, 1) };
}

function handleVertical(e: KeyboardEvent, selection: VisualSelection, blocks: VisualBlock[], dir: 1 | -1) {
    const { desiredColumn, setDesiredColumn } = useEditorStore.getState();

    const { start, end } = selection;
    const xPosition = getVisualPosition(start!, blocks).x;
    if (!desiredColumn) setDesiredColumn(xPosition);

    const cursor = moveCursorLine(end ?? start!, desiredColumn ?? xPosition, blocks, dir);
    if (!e.shiftKey) return { start: cursor ?? start, end: null };
    return { start, end: cursor };
}

function handleArrowUp(e: KeyboardEvent, selection: VisualSelection, blocks: VisualBlock[]) {
    return handleVertical(e, selection, blocks, 1);
}

function handleArrowDown(e: KeyboardEvent, selection: VisualSelection, blocks: VisualBlock[]) {
    return handleVertical(e, selection, blocks, -1);
}

function handleHome(e: KeyboardEvent, selection: VisualSelection) {
    const { start, end } = selection;
    const cursor = goToLineStart(end ?? start!);
    if (e.shiftKey) return { start, end: cursor };
    return { start: cursor, end: null };
}

function handleEnd(e: KeyboardEvent, selection: VisualSelection, blocks: VisualBlock[]) {
    const { start, end } = selection;
    const cursor = goToLineEnd(end ?? start!, blocks);
    if (e.shiftKey) return { start, end: cursor };
    return { start: cursor, end: null };
}