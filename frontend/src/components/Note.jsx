import { useState, useEffect } from "react";
import { usePost } from "hooks/crudHooks";
import styles from "../styling/Note.module.scss";

export default function Note({ role, id, group, user, refetchGroup }) {
  const [noteContent, setContent] = useState();
  const [title, setTitle] = useState();
  const [note, setNote] = useState();
  const [open, setOpen] = useState(false);
  const [save, setSave] = useState(false);
  const [isRole, setRole] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    setTitle(noteData.title);
    if (noteData.date) {
      const dateObject = new Date(noteData.date);
      setDate(dateObject);
    }
    checkRole();
  }

  useEffect(() => {
    loadNote();
  }, []);

  const handleContentInput = (e) => {
    setContent(e.target.value);
  };

  const handleTitleInput = (e) => {
    setTitle(e.target.value);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const saveNote = async () => {
    try {
      await usePost("/api/note/update", {
        noteId: id,
        text: noteContent,
        title,
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

  const deleteNote = async () => {
    setShowConfirm(false);
    try {
      await usePost("/api/note/delete", { noteId: id, groupId: group._id });
      refetchGroup();
      console.log("note deleted");
      handleClose();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = () => {
    setShowConfirm(true);
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
        {note ? title : ""}
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
            {isRole && (
              <input
                className={styles.titleInput}
                type="text"
                value={title}
                maxLength="50"
                onChange={(e) => handleTitleInput(e)}
              />
            )}
            {isRole && (
              <textarea
                className={styles.inputField}
                type="text"
                value={noteContent}
                onChange={(e) => handleContentInput(e)}
              />
            )}
            {!isRole && <h2>{title}</h2>}
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
              {isRole && (
                <button
                  type="button"
                  onClick={handleClose}
                  className={styles.closeButton}
                >
                  Close
                </button>
              )}
              {isRole && (
                <button
                  type="button"
                  onClick={handleSave}
                  className={styles.saveButton}
                >
                  Save
                </button>
              )}
              {isRole && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              )}
              {!isRole && (
                <button
                  type="button"
                  onClick={handleClose}
                  className={styles.notRoleCloseButton}
                >
                  Close
                </button>
              )}
            </div>
            {showConfirm && (
              <div
                role="button"
                onKeyDown={handleKeyPress}
                tabIndex={0}
                className={styles.overlay}
                onClick={() => setShowConfirm(false)}
              >
                {" "}
                <div className={styles.conform}>
                  <p>Are you sure you want to delete this note?</p>
                  <button
                    type="button"
                    onClick={deleteNote}
                    className={styles.conformButton}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className={styles.rejectButton}
                  >
                    No
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
