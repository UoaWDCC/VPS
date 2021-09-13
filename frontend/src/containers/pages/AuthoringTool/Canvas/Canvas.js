/* eslint-disable no-param-reassign */
import React, { useContext, useState } from "react";

import Moveable from "react-moveable";
import SceneContext from "../../../../context/SceneContext";
import styles from "../../../../styling/Canvas.module.scss";
import componentResolver from "./componentResolver";

export default function Canvas() {
  const [select, setSelect] = useState(0);
  const [bounds, setBounds] = useState();
  const { currentScene } = useContext(SceneContext);

  function selectElement({ target }) {
    setSelect(target.id);
  }

  return (
    <>
      <Moveable
        target={document.getElementById(select)}
        draggable
        snappable
        snapThreshold={5}
        throttleDrag={1}
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
            console.log(`x: ${(transfromMatrix[4] * 100) / canvas.width}`);
            console.log(`y: ${(transfromMatrix[5] * 100) / canvas.height}`);
          }
        }}
        onScale={({ target, scale, drag }) => {
          target.style.transform =
            `translate(${drag.beforeTranslate[0]}px, ${drag.beforeTranslate[1]}px)` +
            `scale(${scale[0]}, ${scale[1]})`;
        }}
      />

      <div className={styles.canvasContainer}>
        <div id="canvas" className={styles.canvas}>
          {[{ type: "test" }]
            .concat(currentScene.components || [])
            .map((component, index) =>
              componentResolver(component, index, selectElement)
            )}
        </div>
      </div>
    </>
  );
}
