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

function PopUp({ setTime }) {
  const [open, setOpen] = React.useState(true);
  const handleClose = () => setOpen(false);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Typography id="modal-modal-title" variant="h6" component="h2">
          You have 30 seconds left!
        </Typography>
        <Typography id="modal-modal-description" sx={{ mt: 2 }}>
          Work quickly!
        </Typography>
        <div style={{ "margin-top": "5%" }}>
          <Button
            variant="contained"
            color="black"
            onClick={() => {
              handleClose();
              setTime(new Date().setSeconds(new Date().getSeconds() + 30));
            }}
            style={{ "margin-left": "10%" }}
          >
            Continue
          </Button>
        </div>
      </Box>
    </Modal>
  );
}

export default PopUp;
