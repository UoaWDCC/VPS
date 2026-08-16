import { handleHistoryChange } from "../../scene/history";
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

type Shortcut = {
  combos: string[];
  when?: () => boolean;
  run: () => void;
};

function toggleTextStyle(
  selected: string,
  prop: "fontWeight" | "fontStyle" | "textDecoration",
  enabledValue: "bold" | "italic" | "underline",
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
    run: () => handleHistoryChange("undo"),
  },
  {
    combos: ["mod+shift+z", "mod+y"],
    run: () => handleHistoryChange("redo"),
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
      const { mode, selected } = useEditorStore.getState();
      return !mode.includes("text") && selected.length > 0;
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
