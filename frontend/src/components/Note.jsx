import { React, useState } from "react";
import styles from "../styling/Note.module.scss";

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
      <button type="button" onClick={handleOpen} className={styles.note}>
        Notes
      </button>
    </>
  );
}
