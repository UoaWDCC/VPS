import DragHandles from "./handles/DragHandles";
import Ellipse from "../elements/Ellipse";
import type { Bounds } from "../types";
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
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../../../util/canvas";

const componentMap: Record<string, React.FC<Record<string, unknown>>> = {
  speech: Speech,
  ellipse: Ellipse,
  box: Box,
  line: Line,
};

function resolve(type: string, bounds: Bounds) {
  const Fc = componentMap[type] ?? Box;
  return <Fc bounds={bounds} fill="none" stroke="green" strokeWidth={3} />;
}

function ResolveHandles({ type }: { type: string }) {
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
  const selected = useEditorStore((s) => s.selected);
  const hovered = useEditorStore((s) => s.hovered);
  const mutationBounds = useEditorStore((s) => s.mutationBounds);
  const activeGuides = useEditorStore((s) => s.activeGuides);
  const mode = useEditorStore((s) => s.mode);
  const createType = useEditorStore((s) => s.createType);
  const components = useVisualScene((s) => s.components);

  const hasSelection = selected.length > 0;
  const type = hasSelection
    ? selected.length > 1
      ? "box"
      : components[selected[0]].type
    : null;

  const bounds = getSelectedComponentBounds();
  const verts = bounds?.verts;

  const hoveredComponent = hovered ? components[hovered] : null;

  return (
    <svg
      id="overlay"
      className="w-full h-full absolute pointer-events-none"
      viewBox={`-50 -50 ${CANVAS_WIDTH + 50 * 2} ${CANVAS_HEIGHT + 50 * 2}`}
    >
      {hasSelection && bounds && (
        <>
          <Rectangle
            bounds={bounds}
            rotationOrigin={getBoxCenter(verts!)}
            fill="none"
            stroke="blue"
            strokeWidth={3}
          />
          <ResolveHandles type={type!} />
        </>
      )}
      {hoveredComponent && (
        <Rectangle
          bounds={hoveredComponent.bounds}
          rotationOrigin={getBoxCenter(hoveredComponent.bounds.verts)}
          fill="none"
          stroke="#747775"
          strokeWidth={1}
        />
      )}
      {mode.includes("mutation") &&
        resolve(type ?? createType!, mutationBounds)}
      {mode.includes("mutation") &&
        activeGuides.map((guide, index) => {
          const style = guide.isCanvasCenter
            ? {
                stroke: "var(--color-warning)",
                strokeWidth: 3,
                strokeDasharray: "6 4",
              }
            : { stroke: "var(--color-error)", strokeWidth: 2 };
          return guide.orientation === "vertical" ? (
            <line
              key={index}
              x1={guide.position}
              y1={-50}
              x2={guide.position}
              y2={CANVAS_HEIGHT + 50}
              {...style}
            />
          ) : (
            <line
              key={index}
              x1={-50}
              y1={guide.position}
              x2={CANVAS_WIDTH + 50}
              y2={guide.position}
              {...style}
            />
          );
        })}
    </svg>
  );
}

export default Overlay;
