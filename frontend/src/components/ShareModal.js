import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Typography from "@material-ui/core/Typography";
import React, { useContext, useState } from "react";
import {
  DialogActions,
  DialogContent,
  TextField,
  withStyles,
} from "@material-ui/core";
import ScenarioContext from "../context/ScenarioContext";
// import styles from "../styling/ScreenContainer.module.scss";

export default function ShareModal({ isOpen, handleClose }) {
  const { currentScenario } = useContext(ScenarioContext);
  const [copySuccess, setCopySuccess] = useState(false);
  const url = `${window.location.origin}/play/${currentScenario._id}`;

  const styles = (theme) => ({
    root: {
      margin: 0,
      padding: theme.spacing(2),
    },
    closeButton: {
      position: "absolute",
      right: theme.spacing(1),
      top: theme.spacing(1),
      color: theme.palette.grey[500],
    },
  });

  const DialogTitle = withStyles(styles)((props) => {
    const { children, classes, onClose, ...other } = props;
    return (
      <MuiDialogTitle disableTypography className={classes.root} {...other}>
        <Typography variant="h6">{children}</Typography>
        {onClose ? (
          <IconButton
            aria-label="close"
            className={classes.closeButton}
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        ) : null}
      </MuiDialogTitle>
    );
  });

  return (
    <div>
      <Dialog
        onClose={handleClose}
        aria-labelledby="customized-dialog-title"
        open={isOpen}
        fullWidth="sm"
      >
        <DialogTitle id="customized-dialog-title" onClose={handleClose}>
          Shareable Link
        </DialogTitle>
        <DialogContent>
          <Typography>
            Give this link to others so they can play this scenario
          </Typography>
          <TextField
            defaultValue={url}
            InputProps={{
              readOnly: true,
            }}
            variant="outlined"
            fullWidth
            helperText={copySuccess ? "Copied!" : ""}
          />
          <Button
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
