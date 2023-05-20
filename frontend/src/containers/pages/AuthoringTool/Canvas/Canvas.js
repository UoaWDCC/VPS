/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-param-reassign */
import React, { useContext, useEffect } from "react";

import Moveable from "react-moveable";
import AuthoringToolContext from "../../../../context/AuthoringToolContext";
import SceneContext from "../../../../context/SceneContext";
import styles from "../../../../styling/Canvas.module.scss";
import componentResolver from "./componentResolver";

/**
 * This component represents the editable version of the screen that is shown when a scene is played.
 * It is used to display the scene components on the editing screen. It also bounds the movable components
 * so that they cannot be moved outside of the canvas.
 * @component
 */
export default function Canvas() {
  const { currentScene, updateComponentProperty } = useContext(SceneContext);
  const {
    select,
    selectElement,
    clearElement,
    bounds,
    setBounds,
    shiftPressed,
    setShiftPressed,
    deleteElement,
  } = useContext(AuthoringToolContext);

  useEffect(() => {
    const keyDown = ({ key, target }) => {
      if (key === "Shift") {
        setShiftPressed(true);
      } else if (key === "Delete" || key === "Backspace") {
        if (target.tagName === "BODY" || target.tagName === "BUTTON") {
          deleteElement();
        }
      }
    };

    const keyUp = ({ key }) => {
      if (key === "Shift") {
        setShiftPressed(false);
      }
    };

    document.addEventListener("keydown", keyDown);
    document.addEventListener("keyup", keyUp);
  }, []);

  return (
    <>
      <Moveable
        target={document.getElementById(select)}
        draggable
        throttleDrag={0}
        resizable
        keepRatio={shiftPressed}
        snappable
        bounds={bounds}
        onRenderStart={() => {
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
        onDrag={({ target, left, top }) => {
          target.style.left = `${left}px`;
          target.style.top = `${top}px`;
        }}
        onDragEnd={({ target }) => {
          const canvas = document.getElementById("canvas");
          const targetDoc = document.getElementById(target.id);

          const left = (targetDoc.offsetLeft * 100) / canvas.offsetWidth;
          const top = (targetDoc.offsetTop * 100) / canvas.offsetHeight;
          updateComponentProperty(select, "left", left);
          updateComponentProperty(select, "top", top);
        }}
        onResize={({ target, width, height, drag }) => {
          target.style.width = `${width}px`;
          target.style.height = `${height}px`;
          target.style.left = `${drag.left}px`;
          target.style.top = `${drag.top}px`;
        }}
        onResizeEnd={({ target }) => {
          const canvas = document.getElementById("canvas");
          const targetDoc = document.getElementById(target.id);
          const relWidth = (targetDoc.offsetWidth / canvas.offsetWidth) * 100;
          const relHeight =
            (targetDoc.offsetHeight / canvas.offsetHeight) * 100;
          updateComponentProperty(select, "width", relWidth);
          updateComponentProperty(select, "height", relHeight);

          const left = (targetDoc.offsetLeft * 100) / canvas.offsetWidth;
          const top = (targetDoc.offsetTop * 100) / canvas.offsetHeight;
          updateComponentProperty(select, "left", left);
          updateComponentProperty(select, "top", top);
        }}
      />

      <div className={styles.canvasContainer}>
        <div id="canvas" className={styles.canvas} onClick={clearElement}>
          {currentScene?.components?.map((component, index) =>
            componentResolver(component, index, selectElement)
          )}
        </div>
      </div>
    </>
  );
}
