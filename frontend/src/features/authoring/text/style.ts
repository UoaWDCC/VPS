import { modifyComponentProp } from "../scene/operations/component";
import { applySelectionStyle } from "../scene/operations/text";
import useEditorStore from "../stores/editor";
import { syncVisualCursor } from "./cursor";
import type { BaseTextStyle } from "../types";

type TextStyleValue = BaseTextStyle[keyof BaseTextStyle];

export function setTextStyle(
  selected: string,
  prop: keyof BaseTextStyle,
  value: TextStyleValue
) {
  const { selection, activeStyle, setActiveStyle, setSelection } =
    useEditorStore.getState();

  if (selection?.end) {
    const newSelection = applySelectionStyle(selected, selection, {
      [prop]: value,
    });
    setSelection(newSelection);
    syncVisualCursor();
  } else if (selection?.start) {
    if (prop === "lineHeight" || prop === "alignment") {
      modifyComponentProp(
        selected,
        `document.blocks.${selection.start.blockI}.style.${prop}`,
        value
      );
    } else {
      modifyComponentProp(selected, `document.style.${prop}`, value);
    }
  } else {
    modifyComponentProp(selected, `document.style.${prop}`, value);
  }

  setActiveStyle({ ...(activeStyle ?? {}), [prop]: value } as BaseTextStyle);
}
