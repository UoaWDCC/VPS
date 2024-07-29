import styles from "../styling/NotesDisplayCard.module.scss";

export default function ResourcesDisplayCard({ handleClose }) {
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

        <div className={styles.noteCard}> Put Resources Here</div>
      </div>
    </>
  );
}
