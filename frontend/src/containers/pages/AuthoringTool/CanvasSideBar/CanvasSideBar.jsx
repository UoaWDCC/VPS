import ComponentProperties from "./ComponentProperties";
import SceneSettings from "./SceneSettings";

import styles from "../../../../styling/CanvasSideBar.module.scss";

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
