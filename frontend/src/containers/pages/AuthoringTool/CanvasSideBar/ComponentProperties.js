import React, { useContext } from "react";
import AuthoringToolContext from "../../../../context/AuthoringToolContext";
import SceneContext from "../../../../context/SceneContext";
import componentPropertiesResolver from "./componentPropertiesResolver";

import styles from "../../../../styling/CanvasSideBar.module.scss";

export default function ComponentProperties() {
  const { select } = useContext(AuthoringToolContext);
  const { currentScene } = useContext(SceneContext);

  console.log(`id: ${select}`);
  console.log(currentScene.components);

  return (
    <>
      <div className={styles.componentPropertiesContainer}>
        <h1 className={styles.sideBarHeader}>Component Properties</h1>
        <div
          className={`${styles.sideBarBody} ${
            select === null ? styles.empty : ""
          }`}
        >
          {select === null ? (
            <p className={styles.noComponentSelectedText}>
              No component selected
            </p>
          ) : (
            componentPropertiesResolver(currentScene.components[select], select)
          )}
        </div>
      </div>
    </>
  );
}
