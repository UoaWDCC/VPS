import { React, useState } from "react";
import styles from "../styling/NotesDisplayCard.module.scss";
import Note from "./Note";

export default function NotesDisplayCard() {
  const [name, setName] = useState("default name");
  const [open, setOpen] = useState(false);
  const mockNotes = [
    {
      title: "Note 1",
      content: "Content 1",
      date: "2021-08-01",
      role: "Doctor",
    },
    { title: "Note 2", content: "Content 2", date: "2021-08-02", role: "User" },
    {
      title: "Note 3",
      content: "Content 3",
      date: "2021-08-03",
      role: "Admin",
    },
    { title: "Note 4", content: "Content 4", date: "2021-08-04", role: "User" },
  ];

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
            {mockNotes.map((note) => (
              <Note
                title={note.title}
                content={note.content}
                date={note.date}
                role={note.role}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
