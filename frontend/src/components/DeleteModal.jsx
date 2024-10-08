import { useState } from "react";
import DeleteButton from "./DeleteButton";

function DeleteModal({ onDelete, currentScenario }) {
  const handleClickOpen = () => {
    document.getElementById("delete_modal").showModal();
  };

  const handleClose = () => {
    document.getElementById("delete_modal").close();
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
      <dialog id="delete_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box relative">
          <h3 className="font-bold text-lg text-center text-black">
            Delete Scenario
          </h3>
          <p className="py-4 text-black">
            Are you sure you want to delete the scenario?
          </p>
          <div className="modal-action flex justify-center">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-black">
                ✕
              </button>
              <DeleteButton onClick={handleDelete} className="btn">
                Delete
              </DeleteButton>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default DeleteModal;
