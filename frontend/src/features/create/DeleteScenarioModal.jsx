import { useContext } from "react";
import ModalDialog from "../../components/ModalDialogue";
import ScenarioContext from "../../context/ScenarioContext";

const DeleteScenarioModal = ({ scenario, open, setOpen }) => {
  const { deleteScenario } = useContext(ScenarioContext);

  function handleDelete() {
    if (!scenario) return;
    deleteScenario(scenario._id);
  }

  return (
    <ModalDialog
      title="Delete Scenario"
      open={open}
      onClose={() => setOpen(false)}
    >
      <p>
        Are you sure you want to delete{" "}
        <span className="font-semibold">{scenario?.name}</span>? This cannot be
        undone.
      </p>
      <div className="modal-action flex gap-2">
        <button className="btn">Cancel</button>
        <button className="btn btn-error" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </ModalDialog>
  );
};

export default DeleteScenarioModal;
