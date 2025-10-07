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
import { handleMouseDownGlobal, handleMouseMoveGlobal, handleMouseUpGlobal } from "../handlers/pointer/pointer";
import { handleContextGlobal } from "../handlers/pointer/context";

const componentMap: Record<string, React.FC<any>> = {
  textbox: (props) => <TextBox {...props} editable={true} />,
  speech: Speech,
  ellipse: Ellipse,
  box: Box,
  image: Image,
  line: Line,
};

function resolve(component: Component) {
  const Fc = componentMap[component.type];
  if (Fc) return <Fc key={component.id} {...component} />;
  return null;
}

function Canvas() {
  const scene = useVisualScene(state => state.components);

  const canvasRef = useRef<SVGSVGElement | null>(null);

  if (!scene) return <></>;

  function toSVGSpace(cx: number, cy: number) {
    const boundingRect = canvasRef.current?.children[0];
    if (!boundingRect) return { x: 0, y: 0 };
    const { top, left, width, height } = boundingRect.getBoundingClientRect();
    const x = ((cx - left) / width) * 1920;
    const y = ((cy - top) / height) * 1080;
    return { x, y };
  }

  function handleMouseMove(e: React.MouseEvent) {
    handleMouseMoveGlobal(e, toSVGSpace(e.clientX, e.clientY));
  }

  function handleMouseUp() {
    handleMouseUpGlobal();
  }

  function handleMouseDown(e: React.MouseEvent) {
    handleMouseDownGlobal(e, toSVGSpace(e.clientX, e.clientY));
  }

  function handleContextMenu(e: React.MouseEvent) {
    handleContextGlobal(e, toSVGSpace(e.clientX, e.clientY));
  }

  const components = Object.values(scene).sort((a, b) => a.zIndex - b.zIndex).map(resolve);

  return (
    <CanvasContext.Provider value={{ toSVGSpace, canvasRef }} >
      <div
        className="flex-grow relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
      >
        <Overlay />
        <svg
          id="main"
          className="w-full h-full"
          viewBox={`-50 -50 ${1920 + 50 * 2} ${1080 + 50 * 2}`}
          ref={canvasRef}
        >
          <rect x="0" y="0" width="1920" height="1080" fill="white" />
          {components}
        </svg>
      </div>
    </CanvasContext.Provider>
  );
}

export default Canvas;
