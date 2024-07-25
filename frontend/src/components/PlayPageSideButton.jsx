import styles from "../styling/NotesDisplayCard.module.scss";

export default function PlayPageNoteButton({ handleOpen, buttonName }) {
  return (
    <button
      type="button"
      className={styles.notesButton}
      onClick={() => {
        handleOpen();
      }}
    >
      {buttonName}
    </button>
  );
}
