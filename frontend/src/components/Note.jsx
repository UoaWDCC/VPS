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
      if (userToCheck.email === user.email) {
        if (userToCheck.role === role) {
          setRole(true);
        }
      }
    });
  };

  async function loadNote() {
    const noteData = await usePost("/api/note/retrieve", { noteId: id });
    setNote(noteData);
    setContent(noteData.text);
    if (noteData.date) {
      const dateObject = new Date(noteData.date);
      setDate(dateObject);
    }
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
    console.log("saving note");
    try {
      await saveNote();
      await loadNote();
    } catch (error) {
      console.log(error);
    } finally {
      console.log("note updated");
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
        {note ? note.title : ""}
        <div className={styles.timeInfo}>
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
          <div className={styles.noteContent}>
            {/* Can be changed to display title */}
            <h1>{note.title}</h1>
            {isRole && (
              <textarea
                className={styles.inputField}
                type="text"
                value={noteContent}
                onChange={(e) => handleInput(e)}
              />
            )}
            {!isRole && <p className={styles.inputField}>{noteContent}</p>}
            {date instanceof Date ? (
              <div>
                <p>Last saved at:</p>
                <p>{date.toLocaleDateString()}</p>
                <p>{date.toLocaleTimeString()}</p>
              </div>
            ) : (
              ""
            )}
            <div>
              {" "}
              <button
                type="button"
                onClick={handleClose}
                className={styles.closeButton}
              >
                Close
              </button>
              {isRole && (
                <button
                  type="button"
                  onClick={handleSave}
                  className={styles.saveButton}
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
