import { undo, redo } from "../../scene/history";
import {
  bringForward,
  bringToFront,
  duplicateComponent,
  sendBackward,
  sendToBack,
} from "../../scene/operations/component";
import { remove } from "../../scene/operations/modifiers";
import useEditorStore from "../../stores/editor";
import { handleSelectAll } from "./text";
import { matchesShortcut } from "./utils";
import { setTextStyle } from "../../text/style";
import { toggleBulletShortcut } from "../../text/list";
import { syncVisualCursor } from "../../text/cursor";

type Shortcut = {
  combos: string[];
  when?: () => boolean;
  run: () => void;
};

function toggleTextStyle(
  selected: string,
  prop: "fontWeight" | "fontStyle" | "textDecoration" | "verticalAlign",
  enabledValue: "bold" | "italic" | "underline" | "super" | "sub",
  disabledValue: "normal" | "none"
) {
  const current = useEditorStore.getState().activeStyle;
  const nextValue =
    current?.[prop] === enabledValue ? disabledValue : enabledValue;
  setTextStyle(selected, prop, nextValue);
}

const shortcuts: Shortcut[] = [
  {
    combos: ["mod+z"],
    run: () => undo(),
  },
  {
    combos: ["mod+shift+z", "mod+y"],
    run: () => redo(),
  },
  {
    combos: ["mod+d"],
    when: () => useEditorStore.getState().selected.length > 0,
    run: () => {
      const { selected, setSelected } = useEditorStore.getState();
      if (!selected.length) return;
      setSelected(duplicateComponent(selected));
    },
  },
  {
    combos: ["backspace", "delete"],
    when: () => {
      const { mode, selected, markerSelection } = useEditorStore.getState();
      // a marker selection has its own Backspace/Delete handling (strip
      // list formatting) -- this generic component-delete must yield to it
      return !mode.includes("text") && !markerSelection && selected.length > 0;
    },
    run: () => {
      const { selected, setSelected } = useEditorStore.getState();
      if (!selected.length) return;
      setSelected([]);
      remove(selected);
    },
  },
  {
    combos: ["mod+arrowup"],
    when: () => {
      const { mode, selected } = useEditorStore.getState();
      return !mode.includes("text") && selected.length > 0;
    },
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected.length) return;
      bringForward(selected);
    },
  },
  {
    combos: ["mod+shift+arrowup"],
    when: () => {
      const { mode, selected } = useEditorStore.getState();
      return !mode.includes("text") && selected.length > 0;
    },
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected.length) return;
      bringToFront(selected);
    },
  },
  {
    combos: ["mod+arrowdown"],
    when: () => {
      const { mode, selected } = useEditorStore.getState();
      return !mode.includes("text") && selected.length > 0;
    },
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected.length) return;
      sendBackward(selected);
    },
  },
  {
    combos: ["mod+shift+arrowdown"],
    when: () => {
      const { mode, selected } = useEditorStore.getState();
      return !mode.includes("text") && selected.length > 0;
    },
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected.length) return;
      sendToBack(selected);
    },
  },
  {
    combos: ["mod+a"],
    when: () => useEditorStore.getState().mode.includes("text"),
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected.length) return;
      handleSelectAll(selected[0]);
    },
  },
  {
    combos: ["mod+b"],
    when: () => useEditorStore.getState().mode.includes("text"),
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected.length) return;
      toggleTextStyle(selected[0], "fontWeight", "bold", "normal");
    },
  },
  {
    combos: ["mod+i"],
    when: () => useEditorStore.getState().mode.includes("text"),
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected.length) return;
      toggleTextStyle(selected[0], "fontStyle", "italic", "normal");
    },
  },
  {
    combos: ["mod+u"],
    when: () => useEditorStore.getState().mode.includes("text"),
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected.length) return;
      toggleTextStyle(selected[0], "textDecoration", "underline", "none");
    },
  },
  {
    combos: ["mod+."],
    when: () => useEditorStore.getState().mode.includes("text"),
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected.length) return;
      toggleTextStyle(selected[0], "verticalAlign", "super", "normal");
    },
  },
  {
    combos: ["mod+,"],
    when: () => useEditorStore.getState().mode.includes("text"),
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected.length) return;
      toggleTextStyle(selected[0], "verticalAlign", "sub", "normal");
    },
  },
  {
    // shift+8 usually reports e.key as "*" (the shifted character) rather
    // than "8", so both are matched to work across browsers/layouts
    combos: ["mod+shift+8", "mod+shift+*"],
    when: () => useEditorStore.getState().mode.includes("text"),
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected.length) return;
      toggleBulletShortcut(selected[0]);
      syncVisualCursor();
    },
  },
];

export function handleShortcut(e: KeyboardEvent) {
  for (const shortcut of shortcuts) {
    if (!shortcut.combos.some((combo) => matchesShortcut(e, combo))) continue;
    if (shortcut.when && !shortcut.when()) continue;
    e.preventDefault();
    shortcut.run();
    return true;
  }

  return false;
}
