/**
 * This component shows a confirmation modal when the user attempts to reset the scenario.
 * @component
 */
export default function ResetConfirmationModal({ isOpen, onClose, onConfirm }) {
  return (
    <div>
      <dialog
        id="reset_modal"
        className={`modal ${isOpen ? "modal-open" : ""}`}
      >
        <form method="dialog" className="modal-box relative">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-black"
            onClick={onClose}
          >
            ✕
          </button>

          <h3 className="font-bold text-lg text-center text-black">
            Confirm Reset
          </h3>

          <p className="py-4 text-center text-black">
            This will reset your whole group&apos;s progress to the beginning.
            You will have to notify your group members to re-play through the
            scenario.
          </p>

          <div className="modal-action flex flex-col items-center gap-4">
            <button className="btn important" onClick={onConfirm}>
              Reset Scenario
            </button>
            <button className="btn vps" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
