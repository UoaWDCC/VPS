import Button from "@material-ui/core/Button";
import MuiDialogActions from "@material-ui/core/DialogActions";
import { withStyles } from "@material-ui/core/styles";
import { useContext } from "react";
import { Link } from "react-router-dom";
import ScenarioContext from "context/ScenarioContext";

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
      <dialog id="back_modal" className={`modal ${isOpen ? "modal-open" : ""}`}>
        <form
          method="dialog"
          className="modal-box relative flex flex-col items-center justify-center"
          style={{
            backgroundColor: "white",
            color: "black",
            borderRadius: "10px",
          }}
        >
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={handleClose}
          >
            ✕
          </button>

          <h3 className="font-bold text-lg">You have unsaved changes</h3>

          <div className="py-4">
            <p>Are you sure you want to leave? Unsaved changes will be lost.</p>
          </div>

          <div className="modal-action flex justify-between">
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
          </div>
        </form>
      </dialog>
    </div>
  );
}
