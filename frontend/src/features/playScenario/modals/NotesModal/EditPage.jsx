import AuthenticationContext from "context/AuthenticationContext";
import { useAuthDelete, useAuthGet, useAuthPut } from "hooks/crudHooks";
import { useContext, useEffect, useState } from "react";
import styles from "./Note.module.scss";

export default function EditPage({ role, noteId, group, refetchGroup }) {
  const { user } = useContext(AuthenticationContext);
  const [noteContent, setContent] = useState();
  const [title, setTitle] = useState();
  const [date, setDate] = useState();
  //  lock save process while saving
  const [save, setSave] = useState(false);
  //  check if user has same role
  const [isRole, setRole] = useState(false);
  //  show delete confirmation
  const [showConfirm, setShowConfirm] = useState(false);
  //  is the current version of the note saved
  const [saved, setSaved] = useState(false);
  const {
    response: noteData,
    loading: noteLoading,
    error: noteError,
    getRequest: retrieveNoteRequest,
  } = useAuthGet(`/api/note/retrieve/${noteId}`);

  const {
    response: updateResult,
    loading: updateLoading,
    error: updateError,
    putRequest: updateNoteRequest,
  } = useAuthPut("/api/note/update");

  const {
    response: deleteResult,
    loading: deleteLoading,
    error: deleteError,
    deleteRequest: deleteNoteRequest,
  } = useAuthDelete(`/api/note/delete`);

  const getRole = () => {
    group.users.forEach((userToCheck) => {
      if (userToCheck.email === user.email) {
        if (userToCheck.role === role) {
          setRole(true);
        }
      }
    });
  };

  const loadNote = async () => {
    if (noteData) {
      setContent(noteData.text);
      setTitle(noteData.title);
      if (noteData.date) {
        const dateObject = new Date(noteData.date);
        setDate(dateObject);
      }
    }
  };

  async function fetchNote() {
    console.log("fetching note");
    await retrieveNoteRequest();
    getRole();
  }

  useEffect(() => {
    loadNote();
  }, [noteData]);

  useEffect(() => {
    fetchNote();
  }, []);

  const handleContentInput = (e) => {
    setSaved(false);
    setContent(e.target.value);
  };

  const handleTitleInput = (e) => {
    setSaved(false);
    setTitle(e.target.value);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const saveNote = async () => {
    try {
      await updateNoteRequest({
        noteId,
        text: noteContent,
        title,
        groupId: group._id,
        email: user.email,
      });
      setSaved(true);
    } catch (e) {
      console.log(e);
      throw new Error("Failed to save note");
    }
  };

  const handleSave = async () => {
    if (save) return;
    setSave(true);
    try {
      await saveNote();
      await fetchNote();
    } catch (e) {
      console.log(e);
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
      await deleteNoteRequest({
        noteId,
        groupId: group._id,
        email: user.email,
      });
      refetchGroup();
      handleClose();
    } catch (e) {
      console.log(e);
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

  if (noteLoading) {
    return (
      <div
        role="button"
        onClick={handleOpen}
        onKeyDown={handleKeyPress}
        tabIndex={0}
        className={styles.note}
      >
        Loading...
      </div>
    );
  }

  if (noteError) {
    return (
      <div
        role="button"
        onClick={handleOpen}
        onKeyDown={handleKeyPress}
        tabIndex={0}
        className={styles.note}
      >
        Error
      </div>
    );
  }

  return (
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
      {updateLoading ? <p>Saving...</p> : ""}
      {updateError ? <p>Error saving note</p> : ""}
      {saved && updateResult ? <p>Note saved</p> : ""}
      {deleteLoading ? <p>Deleting...</p> : ""}
      {deleteError ? <p>Error deleting note</p> : ""}
      {deleteResult ? <p>Note deleted</p> : ""}
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
  );
}
