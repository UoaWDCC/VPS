import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import Typography from "@material-ui/core/Typography";
import React, { useContext, useState } from "react";
import { DialogContent, DialogTitle, TextField } from "@material-ui/core";
import ScenarioContext from "../context/ScenarioContext";
import styles from "../styling/ShareModal.module.scss";

export default function ShareModal({ isOpen, handleClose }) {
  const { currentScenario } = useContext(ScenarioContext);
  const [copySuccess, setCopySuccess] = useState(false);
  const url = `${window.location.origin}/play/${currentScenario._id}`;

  return (
    <div>
      <Dialog
        className={styles.dialog}
        onClose={handleClose}
        open={isOpen}
        fullWidth="sm"
      >
        <DialogTitle className={styles.dialogTitle} onClose={handleClose}>
          Shareable Link
        </DialogTitle>
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
            helperText={copySuccess ? "Copied!" : ""}
          />
          <Button
            className={`btn contained white ${styles.dialogItem}`}
            autoFocus
            onClick={() => {
              navigator.clipboard.writeText(url);
              setCopySuccess(true);
            }}
            color="primary"
          >
            Copy Link
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
