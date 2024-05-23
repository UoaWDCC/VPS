import { useState, useEffect } from "react";
import styles from "../styling/NotesDisplayCard.module.scss";
import Note from "./Note";

export default function NotesDisplayCard({ group, user }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  async function loadNotes() {
    console.log("group", group);
    const noteList = Object.entries(group.notes).map(([role, id]) => ({
      role,
      id,
    }));
    setNotes(noteList);
  }

  useEffect(() => {
    loadNotes();
    console.log("user", user);
  }, []);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // const handleCreate = () => {
  //   // create a new note (for testing purposes)
  //   usePost("/api/note/", {
  //     groupId: group._id,
  //     title: "New Note",
  //     role: "Nurse",
  //   });
  //   console.log("note created");
  //   loadNotes();
  // };

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
            aria-label="Close Card"
          />

          <div className={styles.noteCard}>
            {notes.map((note) => (
              <Note
                key={note.id}
                role={note.role}
                id={note.id}
                group={group}
                user={user}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
