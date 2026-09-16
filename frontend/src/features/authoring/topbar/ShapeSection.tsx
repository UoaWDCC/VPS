import { PaintBucket, Pencil, RulerIcon } from "lucide-react";
import ChromePicker from "../wrapper/ChromePicker";
import useEditorStore from "../stores/editor";
import { useEffect, useRef, useState } from "react";
import { getComponent } from "../scene/scene";
import { modifyComponentProp } from "../scene/operations/component";
import { updateHistory, type ChangeRecord } from "../scene/history";
import MultiInput from "../wrapper/MultiInput";
import useVisualScene from "../stores/visual";
import { buildVisualComponent } from "../pipeline";

interface ShapeProps {
  fill: string;
  stroke: string;
  strokeWidth: number;
}

function extractProps(selected: string[]): ShapeProps {
  const c = getComponent(selected[0]) as unknown as ShapeProps;
  return {
    fill: c.fill,
    stroke: c.stroke,
    strokeWidth: c.strokeWidth,
  };
}

function setShapeComponentProp(
  component: NonNullable<ReturnType<typeof getComponent>>,
  prop: keyof ShapeProps,
  value: string | number
) {
  switch (prop) {
    case "fill":
      if ("fill" in component && typeof value === "string") {
        component.fill = value;
      }
      break;

    case "stroke":
      if ("stroke" in component && typeof value === "string") {
        component.stroke = value;
      }
      break;

    case "strokeWidth":
      if ("strokeWidth" in component && typeof value === "number") {
        component.strokeWidth = value;
      }
      break;
  }
}

const widths = [1, 2, 3, 4, 8, 12, 16, 24];

function ShapeSection() {
  const selected = useEditorStore((state) => state.selected);

  const visualComponent = useVisualScene(
    (state) => state.components[selected[0]]
  );

  const [props, setProps] = useState(extractProps(selected));
  const previewStart = useRef<ChangeRecord[] | null>(null);

  useEffect(() => {
    setProps(extractProps(selected));
  }, [selected, visualComponent]);

  function modifyProps(prop: keyof ShapeProps, value: string | number) {
    modifyComponentProp(selected, prop, value);
    setProps((current) => ({ ...current, [prop]: value }));
  }

  function previewProps(prop: keyof ShapeProps, value: string | number) {
    if (!previewStart.current) {
      previewStart.current = selected.map((id) => ({
        id,
        prevState: structuredClone(getComponent(id)),
      }));
    }

    selected.forEach((id) => {
      const component = getComponent(id);

      if (!component) return;

      setShapeComponentProp(component, prop, value);

      useVisualScene
        .getState()
        .updateComponent(buildVisualComponent(component));
    });

    setProps((current) => ({ ...current, [prop]: value }));
  }

  function commitPreview(prop: keyof ShapeProps, value: string | number) {
    selected.forEach((id) => {
      const component = getComponent(id);

      if (!component) return;

      setShapeComponentProp(component, prop, value);
    });

    const previous = previewStart.current;

    if (previous) {
      updateHistory(previous);
      previewStart.current = null;
    }

    setProps((current) => ({ ...current, [prop]: value }));
  }

  return (
    <>
      <ChromePicker
        value={props.fill}
        onPreview={(value) => previewProps("fill", value)}
        onChange={(value) => commitPreview("fill", value)}
        tooltip="Fill color"
      >
        <PaintBucket size={13} />
      </ChromePicker>

      <ChromePicker
        value={props.stroke}
        onPreview={(value) => previewProps("stroke", value)}
        onChange={(value) => commitPreview("stroke", value)}
        tooltip="Stroke color"
      >
        <Pencil size={13} />
      </ChromePicker>

      <MultiInput
        value={props.strokeWidth}
        values={widths}
        onChange={(v) => modifyProps("strokeWidth", v)}
        tooltip="Stroke width"
      >
        <RulerIcon size={16} />
      </MultiInput>
    </>
  );
}

export default ShapeSection;
