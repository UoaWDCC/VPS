import { React, useState } from "react";
import styles from "../styling/NotesDisplayCard.module.scss";
import Note from "./Note";

export default function NotesDisplayCard() {
  const [name, setName] = useState("default name");
  const [open, setOpen] = useState(false);
  const mockNotes = [
    {
      title: "Note 1",
      content:
        "The patient has a headache. Which is likely due to stress. I have prescribed paracetamol.",
      date: "2021-08-01",
      role: "Doctor",
      id: "eo3j932j334",
    },
    {
      title: "Note 2",
      content: "The patient came in at 3pm. He have a headache.",
      date: "2021-08-02",
      role: "Nurse",
      id: "eo3j932j334",
    },
    {
      title: "Note 3",
      content: "The patient has a headache. I have prescribed paracetamol.",
      date: "2021-08-03",
      role: "Pharmacist",
      id: "eo3j932j334",
    },
    {
      title: "Note 4",
      content: "My name is Mr A, I am a patient. I have a headache.",
      date: "2021-08-04",
      role: "Patient",
      id: "eo3j932j334",
    },
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
