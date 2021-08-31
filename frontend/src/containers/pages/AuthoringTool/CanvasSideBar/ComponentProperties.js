import React from "react";

import styles from "../../../../styling/CanvasSideBar.module.scss";

export default function ComponentProperties() {
  return (
    <>
      <div className={styles.componentPropertiesContainer}>
        <h1 className={styles.sideBarHeader}>Component Properties</h1>
        <div className={`${styles.sideBarBody} ${styles.empty}`}>
          <p className={styles.noComponentSelectedText}>
            No component selected
          </p>
        </div>
      </div>
    </>
  );
}
