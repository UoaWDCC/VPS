import ComponentProperties from "features/authoring/CanvasSideBar/ComponentProperties";
import SceneSettings from "features/authoring/CanvasSideBar/SceneSettings";

import styles from "./CanvasSideBar.module.scss";

/**
 * This component displays the properties of scene components in a sidebar
 * @component
 */
export default function CanvasSideBar() {
  return (
    <>
      <div className={styles.sideBar}>
        <SceneSettings />
        <ComponentProperties />
      </div>
    </>
  );
}
