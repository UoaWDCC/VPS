import { DialogContent, DialogTitle } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import MuiDialogActions from "@material-ui/core/DialogActions";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import { useContext } from "react";
import { Link } from "react-router-dom";
import ScenarioContext from "context/ScenarioContext";
import styles from "./BackModal.module.scss";

/**
 * This component shows a confirmation model. It is shown when the user exits the editing tool without saving.
 * @component
 */
export default function BackModal({
  isOpen = true,
  handleClose,
  handleDisgard,
}) {
  const { currentScenario } = useContext(ScenarioContext);

  const DialogActions = withStyles(() => ({
    root: {
      justifyContent: "space-between",
    },
  }))(MuiDialogActions);

  return (
    <div>
      <Dialog
        className={styles.dialog}
        onClose={handleClose}
        open={isOpen}
        maxWidth="xs"
      >
        <DialogTitle className={styles.dialogTitle} onClose={handleClose}>
          You have unsaved changes
        </DialogTitle>
        <DialogContent className={styles.dialogBody}>
          <Typography>
            Are you sure you want to leave? Unsaved changes will be lost.
          </Typography>
        </DialogContent>
        <DialogActions className={`${styles.dialogBody}`}>
          <Button
            className="btn contained red"
            autoFocus
            component={Link}
            to={`/scenario/${currentScenario._id}`}
            color="primary"
            onClick={handleDisgard}
          >
            Yes, discard changes
          </Button>
          <Button
            className="btn contained white"
            autoFocus
            color="primary"
            onClick={handleClose}
          >
            No, keep editing
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
