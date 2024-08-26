import { useAuthPost } from "hooks/crudHooks";
import { useEffect, useState } from "react";

import styles from "../styling/NotesDisplayCard.module.scss";
import Note from "./Note";

export default function NotesDisplayCard({ group, user, handleClose }) {
  const [notes, setNotes] = useState([]);
  const [userRole, setRole] = useState(null);
  const {
    response: groupData,
    loading: groupLoading,
    error: groupError,
    postRequest: retrieveGroupRequest,
  } = useAuthPost("/api/group/");

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
    await retrieveGroupRequest({
      groupId: group._id,
    });
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
              role="button"
              tabIndex={0}
              onKeyDown={handleKeyPress}
              onClick={handleCreate}
              className={styles.createButton}
            >
              <div className={styles.crossHorizontalLine} />
              <div className={styles.crossVerticalLine} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
