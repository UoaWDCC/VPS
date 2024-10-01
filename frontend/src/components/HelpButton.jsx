import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Modal from "@material-ui/core/Modal";
import Typography from "@material-ui/core/Typography";
import HelpIcon from "@material-ui/icons/Help";
import { useState } from "react";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

/**
 * Material UI IconButton for representing a help/info button.
 *
 * @component
 * @example
 * return (
 *   <HelpButton />
 * )
 */
const HelpButton = (props) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const { isSidebar } = props;

  return (
    <>
      {/* <Button
        variant="outlined"
        className={`btn outlined white ${isSidebar ? "side" : "top"}`}
        color="default"
        startIcon={<HelpIcon />}
        onClick={handleOpen}
      >
        Help
      </Button> */}
      <button
        className="btn btn-outline btn-primary cursor-pointer"
        onClick={handleOpen}
      >
        <HelpIcon />
        Help
      </button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Help
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            Welcome to the Virtual Patient Simulator! To create a new scenario,
            click Create and start adding scenes. To play an existing scenario,
            click Play. To edit an existing scenario or the scenes within it,
            click Edit. To delete a scenario, click Delete.
          </Typography>
        </Box>
      </Modal>
    </>
  );
};

export default HelpButton;
