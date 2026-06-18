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
import type { BaseTextStyle } from "../types";
import { setTextStyle } from "../text/style";

function TextSection() {
  const selected = useEditorStore((state) => state.selected)!; // this comp only renders when a text el is selected

  const style = useEditorStore((state) => state.activeStyle);

  if (!style) return null;

  function modifyStyle(prop: keyof BaseTextStyle, value: string | number) {
    setTextStyle(selected, prop, value);
  }

  return (
    <>
      <FontInput
        value={style.fontFamily}
        onChange={(v) => modifyStyle("fontFamily", v)}
      />

      <div className="divider divider-horizontal" />
      <div className="tooltip tooltip-bottom" data-tip="Font size">
        <NumberInput
          value={Number(style.fontSize)}
          onChange={(value) => modifyStyle("fontSize", value)}
        />
      </div>
      <div className="divider divider-horizontal" />

      <ToggleInput
        value={style.fontWeight}
        onToggle={(value) => modifyStyle("fontWeight", value)}
        enabled="bold"
        disabled="normal"
        tooltip="Bold"
      >
        <Bold size={16} />
      </ToggleInput>
      <ToggleInput
        value={style.fontStyle}
        onToggle={(value) => modifyStyle("fontStyle", value)}
        enabled="italic"
        disabled="normal"
        tooltip="Italic"
      >
        <Italic size={16} />
      </ToggleInput>
      <ToggleInput
        value={style.textDecoration}
        onToggle={(value) => modifyStyle("textDecoration", value)}
        enabled="underline"
        disabled="none"
        tooltip="Underline"
      >
        <Underline size={16} />
      </ToggleInput>
      <ChromePicker
        value={style.textColor}
        onChange={(value) => modifyStyle("textColor", value)}
        tooltip="Text color"
      >
        <span>A</span>
      </ChromePicker>
      <ChromePicker
        value={style.highlightColor}
        onChange={(value) => modifyStyle("highlightColor", value)}
        tooltip="Highlight color"
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
        tooltip="Alignment"
      >
        <AlignLeft size={16} />
      </MultiInput>

      <MultiInput
        value={style.lineHeight}
        values={[1, 1.1, 1.25, 1.5, 1.75, 2]}
        onChange={(value) => modifyStyle("lineHeight", value)}
        tooltip="Line height"
      >
        <ArrowDownNarrowWide size={16} />
      </MultiInput>
    </>
  );
}

export default TextSection;
