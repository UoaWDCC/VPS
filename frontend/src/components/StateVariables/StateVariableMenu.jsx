import { Box, Button, Modal, Typography } from "@material-ui/core";
import CreateStateVariable from "./CreateStateVariable";

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
  return (
    <Modal open={show} onClose={() => setShow(false)}>
      <Box sx={style}>
        <Typography variant="h5">State Variable Menu</Typography>
        
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
