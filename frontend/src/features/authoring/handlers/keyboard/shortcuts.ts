import { redo, undo } from "../../scene/history";
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
    run: () => undo(),
  },
  {
    combos: ["mod+shift+z", "mod+y"],
    run: () => redo(),
  },
  {
    combos: ["mod+d"],
    when: () => Boolean(useEditorStore.getState().selected),
    run: () => {
      const { selected, setSelected } = useEditorStore.getState();
      if (!selected) return;
      setSelected(duplicateComponent(selected));
    },
  },
  {
    combos: ["backspace", "delete"],
    when: () => {
      const { mode, selected } = useEditorStore.getState();
      return !mode.includes("text") && Boolean(selected);
    },
    run: () => {
      const { selected, setSelected } = useEditorStore.getState();
      if (!selected) return;
      remove(selected);
      setSelected(null);
    },
  },
  {
    combos: ["mod+arrowup"],
    when: () => Boolean(useEditorStore.getState().selected),
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected) return;
      bringForward(selected);
    },
  },
  {
    combos: ["mod+shift+arrowup"],
    when: () => Boolean(useEditorStore.getState().selected),
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected) return;
      bringToFront(selected);
    },
  },
  {
    combos: ["mod+arrowdown"],
    when: () => Boolean(useEditorStore.getState().selected),
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected) return;
      sendBackward(selected);
    },
  },
  {
    combos: ["mod+shift+arrowdown"],
    when: () => Boolean(useEditorStore.getState().selected),
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected) return;
      sendToBack(selected);
    },
  },
  {
    combos: ["mod+a"],
    when: () => useEditorStore.getState().mode.includes("text"),
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected) return;
      handleSelectAll(selected);
    },
  },
  {
    combos: ["mod+b"],
    when: () => useEditorStore.getState().mode.includes("text"),
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected) return;
      toggleTextStyle(selected, "fontWeight", "bold", "normal");
    },
  },
  {
    combos: ["mod+i"],
    when: () => useEditorStore.getState().mode.includes("text"),
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected) return;
      toggleTextStyle(selected, "fontStyle", "italic", "normal");
    },
  },
  {
    combos: ["mod+u"],
    when: () => useEditorStore.getState().mode.includes("text"),
    run: () => {
      const { selected } = useEditorStore.getState();
      if (!selected) return;
      toggleTextStyle(selected, "textDecoration", "underline", "none");
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
