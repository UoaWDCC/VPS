import { React, useState } from "react";
import styles from "../styling/NotesDisplayCard.module.scss";
import Note from "./Note";

export default function NotesDisplayCard() {
  const [name, setName] = useState("default name");
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.notesButton}
        onClick={() => {
          handleOpen();
        }}
      >
        Notes
      </button>
      {open && (
        <div>
          <div
            className={styles.overlay}
            role="button"
            tabIndex={0}
            onClick={handleClose}
            onKeyDown={handleKeyPress}
            aria-label="Close Create Scenario Card"
          />

          <div className={styles.noteCard}>
            <Note />
            <Note />
            <Note />
            <Note />
          </div>
        </div>
      )}
    </>
  );
}
