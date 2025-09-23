import { useContext } from "react";
import SceneContext from "context/SceneContext";

import styles from "./CanvasSideBar.module.scss";
import useVisualScene from "../stores/visual";
import useEditorStore from "../stores/editor";
import { getComponent } from "../scene/scene";
import ButtonPropertiesComponent from "./ComponentProperties/ButtonPropertiesComponent";

/**
 * This component displays the properties the selected scene component
 * @component
 */
export default function ComponentProperties() {
  const selected = useEditorStore((state) => state.selected);

  const component = selected ? getComponent(selected) : null;

  return (
    <>
      <div className={styles.componentPropertiesContainer}>
        <h1 className={styles.sideBarHeader}>Properties</h1>
        <div className={`${styles.sideBarBody}`}>
          {!component?.clickable ? (
            <p className={styles.noComponentSelectedText}>
              No component selected
            </p>
          ) : (
            <ButtonPropertiesComponent component={component} />
          )}
        </div>
      </div>
    </>
  );
}
