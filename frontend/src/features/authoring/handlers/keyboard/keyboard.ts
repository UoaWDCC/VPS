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

  if (handleShortcut(e)) return;

  if (mode.includes("text")) handleTextMode(e);
  else if (selected) handleComponentOperations(e, selected);
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
