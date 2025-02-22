import { useContext } from "react";
import { useHistory } from "react-router-dom";
import ScenarioContext from "context/ScenarioContext";

/**
 * This component shows a confirmation model. It is shown when the user exits the editing tool without saving.
 * @component
 */
export default function BackModal({ isOpen = true, handleClose }) {
  const { currentScenario } = useContext(ScenarioContext);
  const history = useHistory();

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
            <button
              className="btn important"
              onClick={() => {
                history.push(`/scenario/${currentScenario._id}`);
              }}
            >
              Yes, discard changes
            </button>
            <button className="btn vps" onClick={handleClose}>
              No, keep editing
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
