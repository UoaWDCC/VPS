import { modifyComponentProp } from "../../scene/operations/component";
import { remove } from "../../scene/operations/modifiers";
import useEditorStore from "../../stores/editor";
import type { Vec2 } from "../../types";
import { translate } from "../../util";
import { handleShortcut } from "./shortcuts";
import { handleTextMode } from "./text";
import { isEditableShortcutTarget } from "./utils";

export function handleGlobal(e: KeyboardEvent) {
  const mode = useEditorStore.getState().mode;
  const { selected } = useEditorStore.getState();

  // don't want to interfere with input elements

  const target = e.target as HTMLElement;
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
  if (isEditableShortcutTarget(e.target)) return;

  // alt is used as a live drag/resize modifier (disables snapping); stop the
  // browser's own bare-alt behaviour (e.g. Firefox focusing the menu bar)
  // from firing while the editor has focus
  if (e.key === "Alt") {
    e.preventDefault();
    return;
  }

  const shortcutHandled = handleShortcut(e);
  if (shortcutHandled && !(mode.includes("text") && e.key === "Escape")) {
    return;
  }

  if (mode.includes("text")) handleTextMode(e);
  else if (selected.length) handleComponentOperations(e, selected);
}

// mirrors the Alt guard above on keyup, since some browsers fire their
// bare-alt behaviour there instead of on keydown
export function handleGlobalKeyUp(e: KeyboardEvent) {
  const target = e.target as HTMLElement;
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
  if (isEditableShortcutTarget(e.target)) return;

  if (e.key === "Alt") e.preventDefault();
}

function handleComponentOperations(e: KeyboardEvent, selected: string[]) {
  const { setSelected } = useEditorStore.getState();

  if (e.key === "Backspace") {
    setSelected([]);
    remove(selected);
  } else if (e.key === "ArrowUp") {
    modifyComponentProp(selected, "bounds.verts", (prev: Vec2[]) =>
      translate(prev, { x: 0, y: -5 })
    );
  } else if (e.key === "ArrowDown") {
    modifyComponentProp(selected, "bounds.verts", (prev: Vec2[]) =>
      translate(prev, { x: 0, y: 5 })
    );
  } else if (e.key === "ArrowLeft") {
    modifyComponentProp(selected, "bounds.verts", (prev: Vec2[]) =>
      translate(prev, { x: -5, y: 0 })
    );
  } else if (e.key === "ArrowRight") {
    modifyComponentProp(selected, "bounds.verts", (prev: Vec2[]) =>
      translate(prev, { x: 5, y: 0 })
    );
  }
}
