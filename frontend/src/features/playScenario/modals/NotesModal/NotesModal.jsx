import { useAuthGet, useAuthPost } from "hooks/crudHooks";
import { useEffect, useState } from "react";

import { Add } from "@material-ui/icons";
import Note from "../../components/Note/Note";
import styles from "./NotesModal.module.scss";

export default function NotesModal({ group, user, handleClose }) {
  const [notes, setNotes] = useState([]);
  const [userRole, setRole] = useState(null);
  const {
    response: groupData,
    loading: groupLoading,
    error: groupError,
    getRequest: retrieveGroupRequest,
  } = useAuthGet(`/api/group/retrieve/${group._id}`);

  const {
    response: createResponse,
    loading: noteCreating,
    error: createError,
    postRequest: createNoteRequest,
  } = useAuthPost("/api/note/");

  async function loadNotes() {
    if (!groupData) {
      return;
    }
    const noteList = Object.entries(groupData.notes).flatMap(([role, ids]) =>
      ids.map((id) => ({ role, id }))
    );
    setNotes(noteList);
  }

  useEffect(() => {
    loadNotes();
  }, [groupData]);

  // refetch group data to get updated notes
  async function fetchNotesData() {
    await retrieveGroupRequest();
  }

  useEffect(() => {
    // Check roles
    group.users.forEach((userToCheck) => {
      if (userToCheck.email === user.email) {
        setRole(userToCheck.role);
      }
    });

    fetchNotesData();
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
    fetchNotesData();
  };

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
          {groupLoading ? <div>Loading...</div> : ""}
          {groupError ? <div>Error loading notes</div> : ""}
          {noteCreating ? <div>Creating note...</div> : ""}
          {createError ? <div>Error creating note</div> : ""}
          {createResponse ? <div>Note created</div> : ""}
          <div className={styles.notesContainer}>
            {notes.map((note) => (
              <Note
                key={note.id}
                role={note.role}
                noteId={note.id}
                group={group}
                user={user}
                refetchGroup={fetchNotesData}
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
