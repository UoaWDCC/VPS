import React from "react";
import styles from "../styling/RowContainer.module.scss";

export default function RowContainer({ children }) {
  return (
    <>
      <div className={styles.rowContainer}>{children}</div>
    </>
  );
}
