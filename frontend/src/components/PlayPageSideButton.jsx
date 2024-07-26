import styles from "../styling/PlayPageSideButton.module.scss";

export default function PlayPageNoteButton({
  handleOpen,
  buttonName,
  variant,
}) {
  let buttonClass = styles.notes;

  if (variant === "notes") {
    buttonClass = styles.notes;
  } else if (variant === "resources") {
    buttonClass = styles.resources;
  }

  return (
    <button
      type="button"
      className={buttonClass}
      onClick={() => {
        handleOpen();
      }}
    >
      {buttonName}
    </button>
  );
}
