import { useState, useEffect } from "react";
import { usePost } from "hooks/crudHooks";
import styles from "../styling/NotesDisplayCard.module.scss";
import Note from "./Note";

export default function NotesDisplayCard({ group, user, handleClose }) {
  const [notes, setNotes] = useState([]);

  async function loadNotes(groupData) {
    console.log("group", group);
    const noteList = Object.entries(groupData.notes).flatMap(([role, ids]) =>
      ids.map((id) => ({ role, id }))
    );
    console.log("noteList", noteList);
    setNotes(noteList);
  }
  // refetch group data to get updated notes
  async function loadGroup() {
    console.log("groupID", group._id);
    const groupData = await usePost("/api/group/", {
      groupId: group._id,
    });
    console.log("newGroupData", groupData);
    loadNotes(groupData);
  }

  useEffect(() => {
    loadNotes(group);
  }, []);

  const handleCreate = () => {
    usePost("/api/note/", {
      groupId: group._id,
      title: "New Note",
      role: "Nurse",
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
              />
            ))}
            <button type="button" onClick={handleCreate}>
              New Note
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
