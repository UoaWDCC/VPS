/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-param-reassign */
import React, { useContext } from "react";

import Moveable from "react-moveable";
import AuthoringToolContext from "../../../../context/AuthoringToolContext";
import SceneContext from "../../../../context/SceneContext";
import styles from "../../../../styling/Canvas.module.scss";
import componentResolver from "./componentResolver";

export default function Canvas() {
  const { currentScene } = useContext(SceneContext);
  const {
    select,
    scalable,
    selectElement,
    clearElement,
    bounds,
    setBounds,
    shiftPressed,
    setShiftPressed,
  } = useContext(AuthoringToolContext);

  const keyDown = ({ key }) => {
    if (key === "Shift") {
      setShiftPressed(true);
    }
  };

  const keyUp = ({ key }) => {
    if (key === "Shift") {
      setShiftPressed(false);
    }
  };

  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);

  return (
    <>
      <Moveable
        target={document.getElementById(select)}
        draggable
        throttleDrag={0}
        resizable={!scalable}
        scalable={scalable}
        keepRatio={shiftPressed}
        snappable
        bounds={bounds}
        onDragStart={() => {
          const canvas = document
            .getElementById("canvas")
            .getBoundingClientRect();
          setBounds({
            left: canvas.left,
            top: canvas.top,
            bottom: canvas.bottom,
            right: canvas.right,
          });
        }}
        onDrag={({ target, transform }) => {
          target.style.transform = transform;
        }}
        onDragEnd={({ target }) => {
          const canvas = document
            .getElementById("canvas")
            .getBoundingClientRect();
          const transfromMatrix = window
            .getComputedStyle(target)
            .transform.match(/(-?[0-9\\.]+)/g);
          // X is pos 4, y is pos 5
          // position is top left
          if (transfromMatrix != null) {
            // this if will always be false because it clogs command line, but is here because it contains logic for storing correct positions
            if (transfromMatrix == null) {
              console.log(`x: ${(transfromMatrix[4] * 100) / canvas.width}`);
              console.log(`y: ${(transfromMatrix[5] * 100) / canvas.height}`);
            }
          }
        }}
        onScale={({ target, scale, drag }) => {
          target.style.transform =
            `translate(${drag.beforeTranslate[0]}px, ${drag.beforeTranslate[1]}px)` +
            `scale(${scale[0]}, ${scale[1]})`;
        }}
        onResize={({ target, width, height, drag }) => {
          target.style.width = `${width}px`;
          target.style.height = `${height}px`;
          target.style.transform = `translate(${drag.beforeTranslate[0]}px, ${drag.beforeTranslate[1]}px)`;
        }}
        onResizeEnd={({ target }) => {
          // cover case where no resizing occurs (onResize is not called)
          if (target.style.width.slice(-2) !== "px") {
            return;
          }
          const absWidth = Number(target.style.width.slice(0, -2));
          const absHeight = Number(target.style.height.slice(0, -2));
          const canvas = document
            .getElementById("canvas")
            .getBoundingClientRect();
          const relWidth = `${(absWidth / canvas.width) * 100}%`;
          const relHeight = `${(absHeight / canvas.height) * 100}%`;
          console.log(`width: ${relWidth}`);
          console.log(`height: ${relHeight}`);
          target.style.width = relWidth;
          target.style.height = relHeight;
        }}
      />

      <div className={styles.canvasContainer}>
        <div id="canvas" className={styles.canvas} onClick={clearElement}>
          {[{ type: "test" }, { type: "test" }]
            .concat(currentScene.components || [])
            .map((component, index) =>
              componentResolver(component, index, selectElement)
            )}
        </div>
      </div>
    </>
  );
}
