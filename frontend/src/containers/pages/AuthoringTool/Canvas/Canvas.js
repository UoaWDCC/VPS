/* eslint-disable no-param-reassign */
import React, { useContext, useState } from "react";

import Moveable from "react-moveable";
import SceneContext from "../../../../context/SceneContext";
import styles from "../../../../styling/Canvas.module.scss";
import componentResolver from "./componentResolver";

export default function Canvas() {
  const [select, setSelect] = useState(0);
  const { currentScene } = useContext(SceneContext);

  function selectElement({ target }) {
    setSelect(target.id);
  }

  return (
    <>
      <Moveable
        target={document.getElementById(select)}
        draggable
        scalable
        throttleDrag={0}
        onDrag={({ target, transform }) => {
          target.style.transform = transform;
        }}
        onScale={({ target, scale, drag }) => {
          target.style.transform =
            `translate(${drag.beforeTranslate[0]}px, ${drag.beforeTranslate[1]}px)` +
            `scale(${scale[0]}, ${scale[1]})`;
        }}
      />

      <div className={styles.canvasContainer}>
        <div id="canvas" className={styles.canvas}>
          {[{ type: "test" }, ...currentScene.components].map(
            (component, index) =>
              componentResolver(component, index, selectElement)
          )}
        </div>
      </div>
    </>
  );
}

// 8 8 5 2 2 3 5 2 5
