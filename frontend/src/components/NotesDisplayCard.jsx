import { useState, useEffect } from "react";
import { usePost } from "hooks/crudHooks";
import styles from "../styling/NotesDisplayCard.module.scss";
import Note from "./Note";

export default function NotesDisplayCard({ group, user, handleClose }) {
  const [notes, setNotes] = useState([]);
  const [userRole, setRole] = useState(null);

  async function loadNotes(groupData) {
    const noteList = Object.entries(groupData.notes).flatMap(([role, ids]) =>
      ids.map((id) => ({ role, id }))
    );
    console.log("noteList", noteList);
    setNotes(noteList);
  }

  // refetch group data to get updated notes
  async function loadGroup() {
    const groupData = await usePost("/api/group/", {
      groupId: group._id,
    });
    loadNotes(groupData);
  }

  const checkRole = () => {
    group.users.forEach((userToCheck) => {
      if (userToCheck.email === user.email) {
        setRole(userToCheck.role);
      }
    });
  };

  useEffect(() => {
    console.log(user);
    loadGroup();
    checkRole();
  }, []);

  const handleCreate = async () => {
    if (!userRole) {
      return;
    }
    await usePost("/api/note/", {
      groupId: group._id,
      title: "New Note",
      role: userRole,
    });
    console.log("note created");
    loadGroup();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Escape") {
      handleClose();
    }
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
          <div className={styles.notesContainer}>
            {notes.map((note) => (
              <Note
                key={note.id}
                role={note.role}
                id={note.id}
                group={group}
                user={user}
                refetchGroup={loadGroup}
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
