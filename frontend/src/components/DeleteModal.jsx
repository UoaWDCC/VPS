import { useState } from "react";
import DeleteButton from "./DeleteButton";

function DeleteModal({ onDelete, currentScenario }) {

  const handleClickOpen = () => {
    document.getElementById("my_modal_5").showModal();
  };

  const handleClose = () => {
    document.getElementById("my_modal_5").close();
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
      <dialog id="my_modal_5" className="modal modal-bottom sm:modal-middle">
      <div className="modal-box relative">
    <p className="py-4">Are you sure you want to delete the scenario?</p>
    <div className="modal-action flex justify-center">
      <form method="dialog">
      <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
      <DeleteButton onClick={handleDelete} className="btn">Delete</DeleteButton>
      </form>
    </div>
  </div>
      </dialog>
    </div>
  );
}

export default DeleteModal;
