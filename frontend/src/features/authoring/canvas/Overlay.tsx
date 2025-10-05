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

const componentMap: Record<string, React.FC<any>> = {
  speech: Speech,
  ellipse: Ellipse,
  box: Box,
  line: Line,
};

function resolve(type: Component["type"], bounds: Bounds) {
  const Fc = componentMap[type] ?? Box;
  return <Fc bounds={bounds} fill="none" stroke="green" strokeWidth={2} />;
}

function Overlay() {
  const selected = useEditorStore(state => state.selected)!;
  const bounds = useEditorStore(state => state.mutationBounds);
  const scene = useVisualScene(scene => scene.components);
  const mode = useEditorStore(scene => scene.mode);
  const createType = useEditorStore(scene => scene.createType);

  const component = scene[selected];

  function ResolveHandles() {
    switch (component.type) {
      case "speech":
        return <SpeechHandles />;
      case "line":
        return <LineHandles />;
      default:
        return <DragHandles />;
    }
  }

  return (
    <svg
      id="overlay"
      className="w-full h-full absolute pointer-events-none"
      viewBox={`-50 -50 ${1920 + 50 * 2} ${1080 + 50 * 2}`}
    >
      {component && (
        <>
          <Rectangle
            bounds={component.bounds}
            rotationOrigin={getBoxCenter(component.bounds.verts)}
            fill="none"
            stroke="blue"
            strokeWidth={2}
          />
          <ResolveHandles />
        </>
      )}
      {mode.includes("mutation") && resolve(component?.type ?? createType, bounds)}
    </svg>
  );
};

export default Overlay;
