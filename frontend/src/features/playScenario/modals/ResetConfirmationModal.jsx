import Button from "@material-ui/core/Button";
import MuiDialogActions from "@material-ui/core/DialogActions";
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
    <div>
      <dialog
        id="reset_modal"
        className={`modal ${isOpen ? 'modal-open' : ''}`}
      >
        <form method="dialog" className="modal-box relative">

          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={onClose}
          >
            ✕
          </button>

          <h3 className="font-bold text-lg text-center">Confirm Reset</h3>

          <div className="py-4">
            <p className="text-center">
              This will reset your whole group’s progress to the beginning. You
              will have to notify your group members to re-play through the
              scenario.
            </p>
          </div>

          <div className="modal-action flex flex-col items-center gap-4">
            <Button
              className="btn contained red"
              color="primary"
              onClick={onConfirm}
            >
              Reset Scenario
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
