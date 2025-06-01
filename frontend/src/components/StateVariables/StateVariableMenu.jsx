import { Box, Button, Modal, Typography } from "@material-ui/core";
import CreateStateVariable from "./CreateStateVariable";
import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import ScenarioContext from "context/ScenarioContext";
import { useContext } from "react";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "75vw",
  height: "75vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

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

  return (
    <Modal open={show} onClose={() => setShow(false)}>
      <Box sx={style}>
        <Typography variant="h5">State Variable Menu</Typography>
        <CreateStateVariable
          scenarioId={scenarioId}
          setStateVariables={setStateVariables}
        />
        {stateVariables.map((stateVariable) => (
          <Box key={stateVariable.id} sx={{ margin: "10px 0" }}>
            <Typography variant="subtitle1">
              {stateVariable.name}: {stateVariable.value.toString()}
            </Typography>
          </Box>
        ))}
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShow(false)}
        >
          Close
        </Button>
      </Box>
    </Modal>
  );
};

export default StateVariableMenu;
