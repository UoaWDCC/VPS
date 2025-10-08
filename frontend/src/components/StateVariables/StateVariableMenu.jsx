import { Box, Modal, Typography } from "@material-ui/core";
import CreateStateVariable from "./CreateStateVariable";
import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import ScenarioContext from "context/ScenarioContext";
import { useContext, useState } from "react";
import EditStateVariable from "./EditStateVariable";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";
import ModalDialog from "../ModalDialogue";
import SelectInput from "../../features/authoring/components/Select";
import { stateTypes } from "./stateTypes";

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

  const { stateVariables, setStateVariables } = useContext(ScenarioContext);

  const [name, setName] = useState(null);
  const [type, setType] = useState(null);
  const [value, setValue] = useState(null);

  if (!stateVariables) return null;

  return (
    <ModalDialog wide title="State Variables" open={show} onClose={() => setShow(false)}>
      <CreateStateVariable scenarioId={scenarioId} />
      <div className="divider" />
      <div className="flex flex-col gap-xs">
        {stateVariables.map(variable => (
          <EditStateVariable stateVariable={variable} scenarioId={scenarioId} />
        ))}
      </div>
    </ModalDialog>
  );
};

export default StateVariableMenu;
