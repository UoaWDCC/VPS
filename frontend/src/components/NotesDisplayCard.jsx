import React from "react";
import styles from "../styling/NotesDisplayCard.module.scss";

export default function NotesDisplayCard() {
  return (
    <>
      <button type="button" className={styles.notesButton}>
        Notes
      </button>
    </>
  );
}
