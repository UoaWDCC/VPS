import { React, useState, useEffect } from "react";
import styles from "../styling/NotesDisplayCard.module.scss";
import Note from "./Note";

export default function NotesDisplayCard({ group }) {
  const [name, setName] = useState("default name");
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState([]);

  const loadNotes = () => {
    console.log("group", group);
    const noteList = Object.entries(group.notes).map(([role, id]) => ({
      title: role,
      id,
    }));

    setNotes(noteList);
  };

  useEffect(() => {
    loadNotes();
    console.log("notes", notes);
  }, []);

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
            {notes.map((note) => (
              <Note
                title={note.title}
                content={note.id}
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
