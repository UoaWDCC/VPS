import { useState, useEffect } from "react";
import { usePost } from "hooks/crudHooks";
import styles from "../styling/Note.module.scss";

export default function Note({ role, id, group, user }) {
  const [noteContent, setContent] = useState();
  const [note, setNote] = useState();
  const [open, setOpen] = useState(false);
  const [save, setSave] = useState(false);
  const [isRole, setRole] = useState(false);
  const [date, setDate] = useState();

  const checkRole = () => {
    group.users.forEach((userToCheck) => {
      console.log(userToCheck);
      if (userToCheck.email === user.email) {
        console.log("find it");
        setRole(true);
      }
    });
  };

  async function loadNote() {
    const noteData = await usePost("/api/note/retrieve", { noteId: id });
    const dateObject = new Date(noteData.date);
    setNote(noteData);
    setContent(noteData.text);
    console.log(noteData);
    setDate(dateObject);
    checkRole();
  }

  useEffect(() => {
    loadNote();
  }, []);

  const handleInput = (e) => {
    setContent(e.target.value);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const saveNote = async () => {
    try {
      await usePost("/api/note/update", {
        noteId: id,
        text: noteContent,
        title: note.title,
      });
      console.log("note saved");
    } catch (error) {
      console.log(error);
      throw new Error("Failed to save note");
    }
  };

  const handleSave = async () => {
    if (save) return;
    setSave(true);
    try {
      await saveNote();
      await loadNote();
      console.log("note updated");
    } catch (error) {
      console.log(error);
    } finally {
      setSave(false);
    }
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
        {role ? <h2>{role}</h2> : ""}
        <div>
          {" "}
          {date instanceof Date ? (
            <div>
              <p>Last edit:</p>
              <p>{date.toLocaleDateString()}</p>
              <p>{date.toLocaleTimeString()}</p>
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
      {open && (
        <div>
          {save && <div className={styles.loading}>Saving...</div>}
          <div className={styles.noteContent}>
            <h1>{note.title}</h1>
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
