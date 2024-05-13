import { React, useState } from "react";
import styles from "../styling/Note.module.scss";

export default function Note({ title, content, date, role }) {
  const [noteContent, setContent] = useState(content);
  const [open, setOpen] = useState(false);

  const handleInput = (e) => {
    console.log(e);
    setContent(e.target.value);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleSave = () => {
    console.log("save");
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
        {title ? <h2>{title}</h2> : ""}
        {role ? <p>{role}</p> : ""}
        <div>
          {" "}
          <p>Last edit:</p>
          <p>{date}</p>
        </div>
      </div>
      {open && (
        <div>
          <div className={styles.noteContent}>
            <h1>{title}</h1>
            <textarea
              className={styles.inputField}
              type="text"
              value={noteContent}
              onChange={(e) => handleInput(e)}
            />
            <div>
              {" "}
              <button
                type="button"
                onClick={handleClose}
                className={styles.closeButton}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSave}
                className={styles.saveButton}
              >
                save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
