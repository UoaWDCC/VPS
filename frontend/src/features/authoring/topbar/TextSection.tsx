import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDownNarrowWide,
  Bold,
  Braces,
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
import { getComponent } from "../scene/scene";
import { deleteSelection, insertProperty } from "../scene/operations/text";
import { syncVisualCursor } from "../text/cursor";
import type { Property } from "../text/property";

function PropertyDropdown() {
  const selected = useEditorStore((state) => state.selected);
  const properties = useEditorStore((state) => state.properties);
  const selection = useEditorStore((state) => state.selection);

  const canInsert = !!selection.start;

  function addProperty(property: Property) {
    if (!selection.start) return;

    //delete any selected text
    const cursor = selection.end
      ? deleteSelection(selected, selection)
      : selection.start;
    if (!cursor) return;

    //add property chip to textbox
    const newCursor = insertProperty(selected, cursor, {
      id: property.id,
      displayName: property.name,
    });
    if (!newCursor) return;

    useEditorStore.getState().setSelection({ start: newCursor, end: null });
    syncVisualCursor();
  }

  return (
    <div className="dropdown">
      <li
        className={`tooltip tooltip-bottom ${
          !canInsert || !properties.length ? "menu-disabled" : ""
        }`}
        data-tip="Insert property"
      >
        <a tabIndex={canInsert && properties.length ? 0 : -1}>
          <Braces size={16} />
        </a>
      </li>
      <ul
        tabIndex={0}
        className="dropdown-content menu menu-sm flex-nowrap bg-base-300 rounded-box z-1 shadow-sm top-[38px] min-w-30 w-max max-w-60 max-h-60 overflow-y-auto"
      >
        {properties.map((property) => (
          <li key={property.id}>
            <button
              type="button"
              onClick={() => {
                (document.activeElement as HTMLElement).blur();
                addProperty(property);
              }}
            >
              {property.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TextSection() {
  const selected = useEditorStore((state) => state.selected); // this comp only renders when a text el is selected

  const style = useEditorStore((state) => state.activeStyle);

  if (!style) return null;

  function modifyStyle(prop: keyof BaseTextStyle, value: string | number) {
    // apply to every selected textbox
    // a mixed selection can include non-textbox components (e.g. a shape),
    // which don't have a `document` to write text style props onto
    selected
      .filter((id) => getComponent(id)?.type === "textbox")
      .forEach((id) => setTextStyle(id, prop, value));
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
          <AlignLeft key={0} size={16} />,
          <AlignCenter key={1} size={16} />,
          <AlignRight key={2} size={16} />,
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
      <div className="divider divider-horizontal" />

      <PropertyDropdown />
    </>
  );
}

export default TextSection;
