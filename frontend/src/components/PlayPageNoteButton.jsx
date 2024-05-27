import styles from "../styling/NotesDisplayCard.module.scss";

export default function PlayPageNoteButton({ handleOpen }) {
  return (
    <button
      type="button"
      className={styles.notesButton}
      onClick={() => {
        handleOpen();
      }}
    >
      Notes
    </button>
  );
}
