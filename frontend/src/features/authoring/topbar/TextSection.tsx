import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownNarrowWide,
  Bold,
  Highlighter,
  Italic,
  Underline,
} from "lucide-react";
import useEditorStore from "../stores/editor";
import FontInput from "../wrapper/FontInput";
import NumberInput from "../wrapper/NumberInput";
import ToggleInput from "../wrapper/ToggleInput";
import ChromePicker from "../wrapper/ChromePicker";
import MultiInput from "../wrapper/MultiInput";
import { applySelectionStyle } from "../scene/operations/text";
import { modifyComponentProp } from "../scene/operations/component";
import type { BaseTextStyle } from "../types";
import { syncVisualCursor } from "../text/cursor";

function TextSection() {
  const selected = useEditorStore((state) => state.selected)!; // this comp only renders when a text el is selected
  const selection = useEditorStore((state) => state.selection);

  const style = useEditorStore((state) => state.activeStyle);
  const setStyle = useEditorStore((state) => state.setActiveStyle);

  if (!style) return null;

  function modifyStyle(prop: keyof BaseTextStyle, value: string | number) {
    if (selection?.end) {
      const newSelection = applySelectionStyle(selected, selection, {
        [prop]: value,
      });
      useEditorStore.getState().setSelection(newSelection);
      syncVisualCursor();
    } else if (selection?.start) {
      if (prop === "lineHeight" || prop === "alignment") {
        modifyComponentProp(
          selected,
          `document.blocks.${selection.start.blockI}.style.${prop}`,
          value
        );
      }
    } else {
      modifyComponentProp(selected, `document.style.${prop}`, value);
    }

    setStyle({ ...style!, [prop]: value });
  }

  return (
    <>
      <FontInput
        value={style.fontFamily}
        onChange={(v) => modifyStyle("fontFamily", v)}
      />

      <div className="divider divider-horizontal" />

      <NumberInput
        value={Number(style.fontSize)}
        onChange={(value) => modifyStyle("fontSize", value)}
      />

      <div className="divider divider-horizontal" />

      <ToggleInput
        value={style.fontWeight}
        onToggle={(value) => modifyStyle("fontWeight", value)}
        enabled="bold"
        disabled="normal"
      >
        <Bold size={16} />
      </ToggleInput>
      <ToggleInput
        value={style.fontStyle}
        onToggle={(value) => modifyStyle("fontStyle", value)}
        enabled="italic"
        disabled="normal"
      >
        <Italic size={16} />
      </ToggleInput>
      <ToggleInput
        value={style.textDecoration}
        onToggle={(value) => modifyStyle("textDecoration", value)}
        enabled="underline"
        disabled="none"
      >
        <Underline size={16} />
      </ToggleInput>
      <ChromePicker
        value={style.textColor}
        onChange={(value) => modifyStyle("textColor", value)}
      >
        <span>A</span>
      </ChromePicker>
      <ChromePicker
        value={style.highlightColor}
        onChange={(value) => modifyStyle("highlightColor", value)}
      >
        <Highlighter size={14} />
      </ChromePicker>

      <div className="divider divider-horizontal" />

      <MultiInput
        value={style.alignment}
        values={["left", "center", "right"]}
        items={[
          <AlignLeft size={16} />,
          <AlignCenter size={16} />,
          <AlignRight size={16} />,
        ]}
        onChange={(value) => modifyStyle("alignment", value)}
      >
        <AlignLeft size={16} />
      </MultiInput>

      <MultiInput
        value={style.lineHeight}
        values={[1, 1.1, 1.25, 1.5, 1.75, 2]}
        onChange={(value) => modifyStyle("lineHeight", value)}
      >
        <ArrowDownNarrowWide size={16} />
      </MultiInput>
    </>
  );
}

export default TextSection;
