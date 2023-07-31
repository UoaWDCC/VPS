import React from "react";
import styles from "../../styling/PlayerList.module.scss";

// CRITICAL NOTE:  MUST ADD ACESSLEVEL RQUIRED STAFF TO app.js
export default function PlayerList() {
  return (
    <div className={styles.content}>
      <div className={styles.topBar} />
      <h1>PlayerList</h1>
    </div>
  );
}
