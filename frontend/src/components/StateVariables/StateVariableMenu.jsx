import { Box, Modal, Typography } from "@material-ui/core";
import CreateStateVariable from "./CreateStateVariable";
import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import ScenarioContext from "context/ScenarioContext";
import { useContext } from "react";
import EditStateVariable from "./EditStateVariable";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";

const mainStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "85vw",
  height: "85vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: "10px",
  p: 5,
  display: "flex",
  flexDirection: "column",
  gap: "10px",
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

  const { stateVariables } = useContext(ScenarioContext);

  if (!stateVariables) return null;

  return (
    <Modal open={show} onClose={() => setShow(false)}>
      <Box sx={mainStyle}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5">
            <Box component="span" sx={{ fontWeight: "bold" }}>
              State Variable Menu
            </Box>
          </Typography>
          <IconButton onClick={() => setShow(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Typography variant="subtitle1">Create State Variable</Typography>
        <Box
          sx={{
            marginBottom: "20px",
            padding: "15px 20px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        >
          <CreateStateVariable scenarioId={scenarioId} />
        </Box>
        <Typography variant="subtitle1">Current State Variables</Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            overflowY: "scroll",
            height: "50%",
            padding: "15px 20px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        >
          {stateVariables.map((stateVariable) => (
            <Box key={stateVariable.name} sx={{ margin: "5px 0" }}>
              <EditStateVariable
                stateVariable={stateVariable}
                scenarioId={scenarioId}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Modal>
  );
};

export default StateVariableMenu;
