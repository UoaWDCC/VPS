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
import { getComponent } from "../../scene/scene";
import { getStyleForSelection } from "../../scene/operations/text";

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

function adjustSelectedTextFontSize(delta: number) {
  const { activeStyle, mode, selected, selection } = useEditorStore.getState();
  if (!selected.length) return;

  if (mode.includes("text") && selection.end) {
    if (!activeStyle) return;

    const currentFontSize = Number(activeStyle.fontSize);
    if (!Number.isFinite(currentFontSize)) return;

    setTextStyle(selected[0], "fontSize", currentFontSize + delta);
    return;
  }

  const updates = selected
    .filter((id) => getComponent(id)?.type === "textbox")
    .map((id) => ({
      id,
      fontSize: Number(
        getStyleForSelection(id, { start: null, end: null }).fontSize
      ),
    }));

  updates.forEach(({ id, fontSize }) => {
    if (Number.isFinite(fontSize)) {
      setTextStyle(id, "fontSize", fontSize + delta);
    }
  });
}

function canAdjustSelectedTextFontSize() {
  const { selected } = useEditorStore.getState();

  return selected.some((id) => getComponent(id)?.type === "textbox");
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
  {
    combos: ["mod+shift+>"],
    when: canAdjustSelectedTextFontSize,
    run: () => adjustSelectedTextFontSize(1),
  },
  {
    combos: ["mod+shift+<"],
    when: canAdjustSelectedTextFontSize,
    run: () => adjustSelectedTextFontSize(-1),
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
