import React, { useRef } from "react";
import CanvasContext from "./CanvasContext";
import Overlay from "./Overlay";
import type { Component } from "../types";
import TextBox from "../elements/TextBox";
import Speech from "../elements/Speech";
import Ellipse from "../elements/Ellipse";
import Box from "../elements/Box";
import Image from "../elements/Image";
import Line from "../elements/Line";
import useVisualScene from "../stores/visual";
import {
  handleMouseDownGlobal,
  handleMouseMoveGlobal,
  handleMouseUpGlobal,
} from "../handlers/pointer/pointer";
import { handleContextGlobal } from "../handlers/pointer/context";
import { hasMarqueeMoved } from "../handlers/pointer/marquee";
import LoadingOverlay from "./LoadingOverlay.tsx";
import ZoomControls from "./ZoomControls";
import ImagePlaceholder from "../elements/ImagePlaceholder";
import useEditorStore from "../stores/editor.ts";
import { addText } from "../components/AddText.tsx";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../../../util/canvas";
import Background from "../elements/Background";
import useImageDrop from "../useImageDrop";

const TextableBox = addText(Box);
const TextableEllipse = addText(Ellipse);
const TextableSpeech = addText(Speech);

const componentMap: Record<string, React.FC<Record<string, unknown>>> = {
  textbox: (props) => <TextBox {...props} editable={true} />,
  box: (props) => <TextableBox {...props} />,
  ellipse: (props) => <TextableEllipse {...props} />,
  speech: (props) => <TextableSpeech {...props} />,
  image: Image,
  line: Line,
};

function resolve(component: Component) {
  const Fc = componentMap[component.type];
  if (Fc) return <Fc key={component.id} {...component} />;
  return null;
}

function Canvas() {
  const scene = useVisualScene((state) => state.components);
  const background = useVisualScene((state) => state.background);
  const sceneId = useVisualScene((state) => state.id);
  const pendingImages = useEditorStore((state) => state.pendingImages);
  const loading = useEditorStore((state) => state.loading);

  const mode = useEditorStore((state) => state.mode);
  const createType = useEditorStore((state) => state.createType);
  const zoom = useEditorStore((state) => state.zoom);
  const mutationBounds = useEditorStore((state) => state.mutationBounds);

  const isDraggingMarquee =
    mode.includes("marquee") && hasMarqueeMoved(mutationBounds);

  const canvasRef = useRef<SVGSVGElement | null>(null);

  function toSVGSpace(cx: number, cy: number) {
    const boundingRect = canvasRef.current?.children[0];
    if (!boundingRect) return { x: 0, y: 0 };
    const { top, left, width, height } = boundingRect.getBoundingClientRect();
    const x = ((cx - left) / width) * CANVAS_WIDTH;
    const y = ((cy - top) / height) * CANVAS_HEIGHT;
    return { x, y };
  }

  const { isDraggingOver, dropHandlers } = useImageDrop(toSVGSpace);

  if (!scene) return <></>;

  function handleMouseMove(e: React.MouseEvent) {
    handleMouseMoveGlobal(e, toSVGSpace(e.clientX, e.clientY));
  }

  // the viewport's scrollbars send it mouse events too, which must not read as
  // clicks on the empty canvas
  function isOnScrollbar(e: React.MouseEvent<HTMLElement>) {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    return (
      e.clientX - left >= e.currentTarget.clientWidth ||
      e.clientY - top >= e.currentTarget.clientHeight
    );
  }

  function handleMouseUp(e: React.MouseEvent) {
    // a release that doesn't end a press on the canvas (e.g. one that started
    // on a scrollbar) would otherwise finish a gesture that never began
    if (e.button === 2 || !useEditorStore.getState().mouseDown) return;
    handleMouseUpGlobal();
  }

  function handleMouseDown(e: React.MouseEvent<HTMLElement>) {
    if (e.button === 2 || isOnScrollbar(e)) return;
    handleMouseDownGlobal(e, toSVGSpace(e.clientX, e.clientY));
  }

  function handleContextMenu(e: React.MouseEvent) {
    handleContextGlobal(e);
  }

  const components = Object.values(scene)
    .sort((a, b) => a.zIndex - b.zIndex)
    .map(resolve);

  const placeholders = pendingImages
    .filter((image) => image.sceneId === sceneId)
    .map((image) => <ImagePlaceholder key={image.id} {...image} />);

  return (
    <CanvasContext.Provider value={{ toSVGSpace, canvasRef }}>
      <div
        className={`flex-1 min-w-0 relative overflow-hidden ${loading ? "pointer-events-none" : ""} ${
          mode.includes("create") || isDraggingMarquee ? "cursor-crosshair" : ""
        }`}
        {...dropHandlers}
      >
        {isDraggingOver && (
          <div
            className="
              absolute
              inset-0
              z-[9998]
              flex
              items-center
              justify-center
              border-2
              border-dashed
              border-primary
              bg-primary/10
              pointer-events-none
            "
          >
            <span className="bg-primary/70 text-secondary text-sm font-medium px-4 py-2 rounded-full backdrop-blur-sm">
              Drop image to add it to this scene
            </span>
          </div>
        )}
        {mode.includes("create") && (
          <div
            className="
              fixed
              top-[120px]
              left-1/2
              -translate-x-1/2
              bg-primary/70
              text-secondary
              text-sm
              font-medium
              px-4 py-2
              rounded-full
              backdrop-blur-sm
              pointer-events-none
              z-[9999]
              opacity-75
            "
          >
            Click or drag to create {createType}
          </div>
        )}
        {loading && <LoadingOverlay />}

        {/* the scene is zoomed by resizing it inside this scrollable viewport,
            which owns the pointer handlers so the empty space around a scene
            smaller than the viewport still counts as canvas */}
        <div
          className="w-full h-full overflow-auto flex"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseDown={handleMouseDown}
          onContextMenu={handleContextMenu}
        >
          {/* auto margins centre the scene while it fits, but unlike centred
              alignment they never push an overflowing scene into the negative
              scroll space that can't be scrolled to */}
          <div
            className="relative shrink-0 m-auto"
            style={{
              width: `${Math.round(zoom * 100)}%`,
              height: `${Math.round(zoom * 100)}%`,
            }}
          >
            <Overlay />

            {/* scene outline */}
            <svg
              id="outline"
              className="w-full h-full absolute pointer-events-none"
              viewBox={`-50 -50 ${CANVAS_WIDTH + 50 * 2} ${CANVAS_HEIGHT + 50 * 2}`}
              style={{ mixBlendMode: "difference" }}
            >
              <rect
                x="0"
                y="0"
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                fill="none"
                stroke="var(--color-backdrop-content)"
                strokeWidth="1"
              />
            </svg>

            <svg
              id="main"
              className="w-full h-full"
              viewBox={`-50 -50 ${CANVAS_WIDTH + 50 * 2} ${CANVAS_HEIGHT + 50 * 2}`}
              ref={canvasRef}
            >
              <rect
                x="0"
                y="0"
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                fill="var(--color-canvas)"
              />
              <Background background={background} />
              {components}
              {placeholders}
            </svg>
          </div>
        </div>

        <ZoomControls />
      </div>
    </CanvasContext.Provider>
  );
}

export default Canvas;
