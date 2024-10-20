import { useAuthGet, useAuthPost } from "hooks/crudHooks";
import { useEffect, useState } from "react";

import { Add } from "@material-ui/icons";
import NoteCard from "./NoteCard.jsx";
import styles from "./NotesModal.module.scss";

export default function NotesModal({ group, user, handleClose }) {
  const [notes, setNotes] = useState([]);
  const [userRole, setRole] = useState(null);

  const {
    response: groupData,
    loading: groupLoading,
    error: groupError,
    getRequest: retrieveNotes,
  } = useAuthGet(`/api/note/retrieveAll/${group._id}`, setNotes);

  const {
    response: createResponse,
    loading: noteCreating,
    error: createError,
    postRequest: createNoteRequest,
  } = useAuthPost("/api/note/");

  useEffect(() => {
    // Check roles
    group.users.forEach((userToCheck) => {
      if (userToCheck.email === user.email) {
        setRole(userToCheck.role);
      }
    });

    retrieveNotes();
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === "Escape") {
      handleClose();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  const handleCreate = async () => {
    if (!userRole) {
      return;
    }
    await createNoteRequest({
      groupId: group._id,
      title: "New Note",
      email: user.email,
    });
    retrieveNotes();
  };

  console.log(notes);

  return (
    <>
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
          <div className={styles.notesContainer}>
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                title={note.title}
                role={note.role}
                text={note.text}
                date={note.date}
              />
            ))}
            <div
              className="card bg-slate-50 w-60 h-40 shadow-xl cursor-pointer hover:border-2 border-slate-300"
              onClick={handleCreate}
              onKeyDown={handleKeyPress}
            >
              <div className="card-body flex justify-center items-center text-slate-500">
                <Add fontSize="large" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
