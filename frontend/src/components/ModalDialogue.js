import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import MuiDialogContent from "@material-ui/core/DialogContent";
import MuiDialogActions from "@material-ui/core/DialogActions";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Typography from "@material-ui/core/Typography";

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

export default function ModalDialogue({
  title,
  children,
  dialogueAction,
  isShowing,
  hide,
}) {
  return (
    <div>
      <Dialog
        onClose={hide}
        aria-labelledby="customized-dialog-title"
        open={isShowing}
      >
        <DialogTitle id="customized-dialog-title" onClose={hide}>
          {title}
        </DialogTitle>
        <MuiDialogContent dividers>{children}</MuiDialogContent>
        <MuiDialogActions>{dialogueAction}</MuiDialogActions>
      </Dialog>
    </div>
  );
}
