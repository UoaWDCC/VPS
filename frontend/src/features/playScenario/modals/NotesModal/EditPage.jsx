import AuthenticationContext from "context/AuthenticationContext";
import { useAuthDelete, useAuthGet, useAuthPut } from "hooks/crudHooks";
import { useContext, useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import styles from "./Note.module.scss";

export default function EditPage({ role, noteId, group, goBack, handleClose }) {
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

  const loadNote = async () => {
    if (noteData) {
      setContent(noteData.text);
      setTitle(noteData.title);
      if (noteData.date) {
        const dateObject = new Date(noteData.date);
        setDate(dateObject);
      }
      if (noteData.role === role) {
        setRole(true);
      }
    }
  };

  async function fetchNote() {
    await retrieveNoteRequest();
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

  const deleteNote = async () => {
    setShowConfirm(false);
    try {
      await deleteNoteRequest({
        noteId,
        groupId: group._id,
        email: user.email,
      });
      handleClose();
    } catch (e) {
      console.log(e);
    }
  };

  const handleDelete = () => {
    setShowConfirm(true);
  };

  return (
    <>
      <div className="flex w-full justify-between gap-10">
        <input
          className="text-2xl font-semibold grow bg-slate-50 p-2 rounded-md border-slate-300 border-2"
          type="text"
          value={title}
          maxLength="50"
          onChange={handleTitleInput}
          disabled={!isRole}
        />
        <button type="button" onClick={goBack}>
          <ArrowBackIcon />
        </button>
        <button type="button" onClick={handleClose}>
          <CloseIcon />
        </button>
      </div>
      <textarea
        className="w-full grow bg-slate-50 p-2 rounded-md border-slate-300 border-2"
        type="text"
        value={noteContent}
        onChange={(e) => handleContentInput(e)}
        disabled={!isRole}
      />
      <div className="flex flex-row justify-between">
        {date ? (
          <p>
            {`Last edit: ${date.toLocaleDateString()} at ${date.toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )}`}
            {}
          </p>
        ) : (
          ""
        )}
        {isRole && (
          <div className="flex gap-10 grow flex-row-reverse">
            <button
              type="button"
              onClick={handleSave}
              className="btn vps w-[100px]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="btn vps important w-[100px]"
            >
              Delete
            </button>
          </div>
        )}
      </div>
      {showConfirm && (
        <div
          role="button"
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
    </>
  );
}
