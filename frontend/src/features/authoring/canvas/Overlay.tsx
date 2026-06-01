import DragHandles from "./handles/DragHandles";
import Ellipse from "../elements/Ellipse";
import type { Bounds, Component } from "../types";
import Box from "../elements/Box";
import { getBoxCenter } from "../util";
import Speech from "../elements/Speech";
import Line from "../elements/Line";
import LineHandles from "./handles/LineHandles";
import SpeechHandles from "./handles/SpeechHandles";
import Rectangle from "./Rectangle";
import useEditorStore from "../stores/editor";
import useVisualScene from "../stores/visual";
import { getSelectedComponentBounds } from "../handlers/pointer/pointer";

const componentMap: Record<string, React.FC<any>> = {
  speech: Speech,
  ellipse: Ellipse,
  box: Box,
  line: Line,
};

function resolve(type: Component["type"], bounds: Bounds) {
  const Fc = componentMap[type] ?? Box;
  return <Fc bounds={bounds} fill="none" stroke="green" strokeWidth={3} />;
}

function ResolveHandles({
  type,
  isMultiSelect,
}: {
  type: string;
  isMultiSelect: boolean;
}) {
  if (isMultiSelect) return <DragHandles />;
  switch (type) {
    case "speech":
      return <SpeechHandles />;
    case "line":
      return <LineHandles />;
    default:
      return <DragHandles />;
  }
}

function Overlay() {
  const { selected, mode, createType, mutationBounds } =
    useEditorStore.getState();

  const components = useVisualScene.getState().components;

  const primaryComponent =
    selected.length === 0 ? null : components[selected[0]];

  const bounds = getSelectedComponentBounds();
  const verts = bounds.verts;

  return (
    <svg
      id="overlay"
      className="w-full h-full absolute pointer-events-none"
      viewBox={`-50 -50 ${1920 + 50 * 2} ${1080 + 50 * 2}`}
    >
      {primaryComponent && (
        <>
          <Rectangle
            bounds={bounds}
            rotationOrigin={getBoxCenter(verts)}
            fill="none"
            stroke="blue"
            strokeWidth={3}
          />
          <ResolveHandles
            type={primaryComponent?.type}
            isMultiSelect={selected.length > 1}
          />
        </>
      )}
      {mode.includes("mutation") &&
        resolve(primaryComponent?.type ?? createType, mutationBounds as Bounds)}
    </svg>
  );
}

export default Overlay;
