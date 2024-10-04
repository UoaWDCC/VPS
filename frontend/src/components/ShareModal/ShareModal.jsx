import { DialogContent, DialogTitle, TextField } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import Typography from "@material-ui/core/Typography";
import { useContext, useState } from "react";
import ScenarioContext from "../../context/ScenarioContext";
import styles from "./ShareModal.module.scss";

/**
 * Component used to a display a share model on the screen, conisting of a copiable link and a button.
 *
 * @component
 * @example
 * const isOpen = false
 * function handleClose() {
 *   console.log("Closed.")
 * }
 * return (
 *   <ShareModal isOpen={isOpen} handleClose={handleClose} />
 * )
 */
export default function ShareModal({ isOpen, handleClose }) {
  const { currentScenario } = useContext(ScenarioContext);
  const [copySuccess, setCopySuccess] = useState(false);
  const url = `${window.location.origin}/play/${currentScenario._id}`;

  /** Function which executes when the modal is closed. */
  function onClose() {
    handleClose();
    setCopySuccess(false);
  }

  return (
    <div>
      <Dialog
        className={styles.dialog}
        onClose={onClose}
        open={isOpen}
        maxWidth="sm"
      >
        <DialogTitle className={styles.dialogTitle}>Shareable Link</DialogTitle>
        <DialogContent className={styles.dialogContent}>
          <Typography className={styles.dialogItem}>
            Give this link to others so they can play this scenario
          </Typography>
          <TextField
            className={`${styles.textField} ${styles.dialogItem}`}
            defaultValue={url}
            InputProps={{
              readOnly: true,
            }}
            variant="outlined"
            fullWidth
          />
          <button
            className="btn vps"
            onClick={() => {
              navigator.clipboard.writeText(url);
              setCopySuccess(true);
            }}
          >
            {copySuccess ? "Copied!" : "Copy Link"}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
