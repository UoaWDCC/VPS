import { React, useState } from "react";
import styles from "../styling/Note.module.scss";

export default function Note({ title, content, date, role }) {
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
      <div
        role="button"
        onClick={handleOpen}
        onKeyDown={handleKeyPress}
        tabIndex={0}
        className={styles.note}
      >
        {title ? <h2>{title}</h2> : "Untitled Note"}
        {role ? <p>{role}</p> : ""}
        <p>Last edit:</p>
        <p>{date}</p>
      </div>
      {open && (
        <div>
          <div className={styles.noteContent}>
            <h1>{title}</h1>
            <p>{content}</p>
            <button
              type="button"
              onClick={handleClose}
              className={styles.closeButton}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
