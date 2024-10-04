import { DialogContent, DialogTitle } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import MuiDialogActions from "@material-ui/core/DialogActions";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";

/**
 * This component shows a confirmation modal when the user attempts to reset the scenario.
 * @component
 */
export default function ResetConfirmationModal({ isOpen, onClose, onConfirm }) {
  const DialogActions = withStyles(() => ({
    root: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center", // Center the text and buttons horizontally
      gap: "16px",
    },
  }))(MuiDialogActions);

  return (
    <Dialog onClose={onClose} open={isOpen} maxWidth="xs">
      <DialogTitle>Confirm Reset</DialogTitle>
      <DialogContent>
        <Typography>
          This will reset your whole group’s progress to the beginning. You will
          have to notify your group members to re-play through the scenario.
        </Typography>
      </DialogContent>
      <DialogActions>
        <button className="btn error" onClick={onConfirm}>
          Reset Scenario
        </button>
        <button className="btn vps" onClick={onClose}>
          Cancel
        </button>
      </DialogActions>
    </Dialog>
  );
}
