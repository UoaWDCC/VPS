import styles from "../styling/NotesDisplayCard.module.scss";

export default function PlayPageSideButton({ handleOpen, buttonName }) {
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
