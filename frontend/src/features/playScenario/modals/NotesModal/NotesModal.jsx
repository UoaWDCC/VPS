import { useEffect, useState } from "react";

import styles from "./NotesModal.module.scss";
import ViewPage from "./ViewPage.jsx";
import EditPage from "./EditPage";

export default function NotesModal({ group, user, handleClose }) {
  const [content, setContent] = useState("");
  const [role, setRole] = useState(null);

  const handleKeyPress = (e) => {
    if (e.key === "Escape") handleClose();
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  useEffect(() => {
    group.users.forEach((userToCheck) => {
      if (userToCheck.email === user.email) {
        setRole(userToCheck.role);
      }
    });
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
          <div className="flex flex-col gap-5 w-full">
            {!content ? (
              <ViewPage
                group={group}
                user={user}
                role={role}
                setContent={setContent}
                handleClose={handleClose}
              />
            ) : (
              <EditPage
                noteId={content}
                group={group}
                role={role}
                goBack={() => setContent("")}
                handleClose={handleClose}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
