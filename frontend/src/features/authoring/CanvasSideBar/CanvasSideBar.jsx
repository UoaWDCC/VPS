import styles from "./CanvasSideBar.module.scss";
import ComponentProperties from "./ComponentProperties";
import SceneSettings from "./SceneSettings";

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
