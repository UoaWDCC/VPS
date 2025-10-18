import CreateStateVariable from "./CreateStateVariable";
import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import ScenarioContext from "context/ScenarioContext";
import { useContext } from "react";
import EditStateVariable from "./EditStateVariable";
import ModalDialog from "../ModalDialogue";

/**
 * Component used for creating, editing, and deleting state variables
 *
 * @component
 * @example
 * const [show, setShow] = useState(false);
 * return (
 *   <Button onClick={() => setShow(true)}>Open State Variable Menu</Button>
 *   <StateVariableMenu show={show} setShow={setShow} />
 * )
 */
const StateVariableMenu = ({ show, setShow }) => {
  const { scenarioId } = useParams();

  const { stateVariables } = useContext(ScenarioContext);

  if (!stateVariables) return null;

  return (
    <ModalDialog
      wide
      title="State Variables"
      open={show}
      onClose={() => setShow(false)}
    >
      <CreateStateVariable scenarioId={scenarioId} />
      <div className="divider" />
      <div className="flex flex-col gap-xs">
        {stateVariables.map((variable, i) => (
          <EditStateVariable
            key={i}
            stateVariable={variable}
            scenarioId={scenarioId}
          />
        ))}
      </div>
    </ModalDialog>
  );
};

export default StateVariableMenu;
