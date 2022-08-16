import * as React from "react";
import Modal from "@material-ui/core/Modal";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "20%",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

const Notification = ({ scene }) => {
  const [open, setOpen] = React.useState(true);
  const handleClose = () => setOpen(false);
  const closeTab = () => window.close();

  /* function to restart the scenario upon timer completion */
  function handleRestartScenario() {
    window.location.href = window.parent.location;
  }

  /* function to restart the scene upon timer completion */
  function handleRestartScene() {}

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          Out of Time!
        </Typography>
        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
          Exit the scenario or continue:
        </Typography>
        <div style={{ "margin-top": "5%" }}>
          <Button variant="contained" color="black" onClick={closeTab}>
            Exit
          </Button>
          <Button
            variant="contained"
            color="black"
            onClick={handleClose}
            style={{ "margin-left": "10%" }}
          >
            Continue
          </Button>
          <Button
            variant="contained"
            color="black"
            onClick={handleRestartScenario}
            style={{ "margin-top": "5%" }}
          >
            Restart Scenario
          </Button>
          <Button
            variant="contained"
            color="black"
            onClick={handleRestartScene}
            style={{ "margin-top": "5%" }}
          >
            Restart Scene
          </Button>
        </div>
      </Box>
    </Modal>
  );
};

export default Notification;
