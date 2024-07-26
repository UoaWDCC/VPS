import { usePost } from "hooks/crudHooks";
import { useEffect, useState, useContext } from "react";
import AuthenticationContext from "context/AuthenticationContext";

import styles from "../styling/NotesDisplayCard.module.scss";
import Note from "./Note";

export default function NotesDisplayCard({ group, user, handleClose }) {
  const [notes, setNotes] = useState([]);
  const [userRole, setRole] = useState(null);
  const { getUserIdToken } = useContext(AuthenticationContext);

  async function loadNotes(groupData) {
    const noteList = Object.entries(groupData.notes).flatMap(([role, ids]) =>
      ids.map((id) => ({ role, id }))
    );
    console.log("noteList", noteList);
    setNotes(noteList);
  }

  // refetch group data to get updated notes
  async function fetchNotesData() {
    const groupData = await usePost("/api/group/", {
      groupId: group._id,
    });
    await loadNotes(groupData);
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

  const handleCreate = async () => {
    if (!userRole) {
      return;
    }
    await usePost(
      "/api/note/",
      {
        groupId: group._id,
        title: "New Note",
        email: user.email,
      },
      getUserIdToken
    );
    console.log("note created");
    fetchNotesData();
  };

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
              <Note
                key={note.id}
                role={note.role}
                id={note.id}
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
