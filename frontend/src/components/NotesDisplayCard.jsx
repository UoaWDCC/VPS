import { React, useState, useEffect } from "react";
import { usePost } from "hooks/crudHooks";
import styles from "../styling/NotesDisplayCard.module.scss";
import Note from "./Note";

export default function NotesDisplayCard({ group }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState([]);

  const loadNotes = () => {
    console.log("group", group);
    const noteList = Object.entries(group.notes).map(([role, id]) => ({
      id,
    }));
    const noteData = [];
    // retrieve notes from backend using noteId
    noteList.forEach((note) => {
      note = usePost("/api/note/retrieve", { noteId: note.id });

      noteData.push(noteData);
    });

    setNotes(noteList);
  };

  useEffect(() => {
    loadNotes();
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
