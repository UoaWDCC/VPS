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
      {/* <DeleteButton
        className="btn side"
        variant="contained"
        onClick={handleClickOpen}
        disabled={!currentScenario}
      >
        Delete
      </DeleteButton> */}
      <button
        className="btn btn-error text-primary disabled:bg-error disabled:text-primary disabled:opacity-30 w-full"
        onClick={handleClickOpen}
        disabled={!currentScenario}
      >
        Delete
      </button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Are you sure you want to delete the scenario?</DialogTitle>
        <DialogActions>
          <button
            className="btn btn-primary text-secondary"
            onClick={handleClose}
          >
            Go Back
          </button>
          <button className="btn btn-error text-primary" onClick={handleDelete}>
            Delete
          </button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default DeleteModal;
