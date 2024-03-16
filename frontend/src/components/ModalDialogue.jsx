import Dialog from "@material-ui/core/Dialog";
import MuiDialogActions from "@material-ui/core/DialogActions";
import MuiDialogContent from "@material-ui/core/DialogContent";
import MuiDialogTitle from "@material-ui/core/DialogTitle";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";

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

/**
 * Material-UI dialog title component with custom styling used as a dialog title.
 *
 * @component
 * @example
 * return (
 *   <DialogTitle />
 * )
 */
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

/**
 * Component used to a display a model on the screen.
 *
 * @component
 * @example
 * const title = "Title"
 * const dialogueAction = { ... }
 * const isShowing = false
 * function hide() {
 *   console.log("Hidden.")
 * }
 * return (
 *   <ModalDialogue title={title} dialogueAction={dialogueAction} isShowing={isShowing} hide={hide} >
 *     { ... }
 *   </ModalDialogue>
 * )
 */
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
