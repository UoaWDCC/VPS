/* eslint-disable no-param-reassign */
import { Box } from "@material-ui/core";
import React, { useRef, useState } from "react";

import Moveable from "react-moveable";
import styles from "../../../styling/Canvas.module.scss";

export default function Canvas() {
  const [select, setSelect] = useState(0);

  function selectElement({ target }) {
    setSelect(target.id);
    console.log(target);
  }

  return (
    <>
      <Moveable
        target={document.getElementById(select)}
        draggable
        resizable
        throttleDrag={0}
        onDrag={({ target, transform }) => {
          target.style.transform = transform;
        }}
        onDragEnd={({ target, isDrag, clientX, clientY }) => {
          const canvas = document
            .getElementById("canvas")
            .getBoundingClientRect();
          console.log("onDragEnd", clientX - canvas.left, clientY - canvas.top);
        }}
        onResize={({ target, width, height }) => {
          target.style.width = `${width}px`;
          target.style.height = `${height}px`;
        }}
        onScale={({ target, transform }) => {
          target.style.transform = transform;
        }}
      />
      <div className={styles.canvasContainer}>
        <div id="canvas" className={styles.canvas}>
          <div>
            <Box className={styles.moveable} id={0} onClick={selectElement} />
          </div>
          <div>
            <Box className={styles.moveable} id={1} onClick={selectElement} />
          </div>
          <div>
            <Box className={styles.moveable} id={2} onClick={selectElement} />
          </div>
          <div>
            <Box className={styles.moveable} id={3} onClick={selectElement} />
          </div>
          <div>
            <Box className={styles.moveable} id={4} onClick={selectElement} />
          </div>
        </div>
      </div>
    </>
  );
}
