import { PaintBucket, Pencil, RulerIcon } from "lucide-react";
import ChromePicker from "../wrapper/ChromePicker";
import NumberInput from "../wrapper/NumberInput";
import useEditorStore from "../stores/editor";
import { useEffect, useState } from "react";
import { getComponent } from "../scene/scene";
import { modifyComponentProp } from "../scene/operations/component";
import MultiInput from "../wrapper/MultiInput";

interface ShapeProps {
  fill: string;
  stroke: string;
  strokeWidth: number;
}

function extractProps(selected: string): ShapeProps {
  const { fill, stroke, strokeWidth } = getComponent(selected);
  return { fill, stroke, strokeWidth };
}

const widths = [1, 2, 3, 4, 8, 12, 16, 24];

function ShapeSection() {
  const selected = useEditorStore((state) => state.selected)!;

  const [props, setProps] = useState(extractProps(selected));

  useEffect(() => {
    setProps(extractProps(selected));
  }, [selected]);

  function modifyProps(prop: string, value: string | number) {
    modifyComponentProp(selected!, `${prop}`, value);
    setProps({ ...props, [prop]: value });
  }

  return (
    <>
      <ChromePicker
        value={props.fill}
        onChange={(value) => modifyProps("fill", value)}
      >
        <PaintBucket size={13} />
      </ChromePicker>
      <ChromePicker
        value={props.stroke}
        onChange={(value) => modifyProps("stroke", value)}
      >
        <Pencil size={13} />
      </ChromePicker>
      <MultiInput
        value={props.strokeWidth}
        values={widths}
        onChange={(v) => modifyProps("strokeWidth", v)}
      >
        <RulerIcon size={16} />
      </MultiInput>
    </>
  );
}

export default ShapeSection;
