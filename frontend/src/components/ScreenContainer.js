import React from "react";
import styles from "../styling/ScreenContainer.module.scss";

export default function ScreenContainer({ children, vertical }) {
  return (
    <>
      <div className={vertical ? styles.colContainer : styles.rowContainer}>
        {children}
      </div>
    </>
  );
}
