import { useState } from "react";
import Button from "@mui/material/Button";
import { Dialog, DialogActions, DialogTitle } from "@mui/material";
import DeleteButton from "./DeleteButton";

function DeleteModal({ onDelete, currentScenario }) {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDelete = () => {
    onDelete();
    handleClose();
  };

  return (
    <div>
      <DeleteButton
        className="btn side"
        variant="contained"
        onClick={handleClickOpen}
        disabled={!currentScenario}
      >
        Delete
      </DeleteButton>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Are you sure you want to delete the scenario?</DialogTitle>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Go Back
          </Button>
          <DeleteButton onClick={handleDelete}>Delete</DeleteButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default DeleteModal;
