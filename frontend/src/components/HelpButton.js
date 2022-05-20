import React from "react";
import HelpIcon from "@material-ui/icons/Help";
import Button from "@material-ui/core/Button";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Modal from "@material-ui/core/Modal";

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
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const { isSidebar } = props;

  return (
    <>
      <Button
        variant="outlined"
        className={`btn outlined white ${isSidebar ? "side" : "top"}`}
        color="default"
        startIcon={<HelpIcon />}
        onClick={handleOpen}
      >
        Help
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Help Section
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
          </Typography>
        </Box>
      </Modal>
    </>
  );
};

export default HelpButton;
