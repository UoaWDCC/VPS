import React from "react";
import styles from "../styling/ScreenContainer.module.scss";

/**
 * Component used to encapsulate the entire application.
 *
 * @component
 * @example
 * const vertical = true
 * return (
 *   <ScreenContainer vertical={vertical} >
 *     { ... }
 *   </ScreenContainer>
 * )
 */
export default function ScreenContainer({ children, vertical }) {
  return (
    <>
      <div className={vertical ? styles.colContainer : styles.rowContainer}>
        {children}
      </div>
    </>
  );
}
