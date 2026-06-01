import { PaintBucket, Pencil, RulerIcon } from "lucide-react";
import ChromePicker from "../wrapper/ChromePicker";

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

const defaultProps: ShapeProps = {
  fill: "#000000",
  stroke: "#000000",
  strokeWidth: 1,
};

function extractProps(selected: string[]): ShapeProps {
  if (!selected || selected.length === 0) return defaultProps;
  const component = getComponent(selected[0]);
  return {
    fill: component?.fill ?? defaultProps.fill,
    stroke: component?.stroke ?? defaultProps.stroke,
    strokeWidth: component?.strokeWidth ?? defaultProps.strokeWidth,
  };
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
