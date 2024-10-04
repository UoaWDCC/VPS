import Button from "@material-ui/core/Button";
import { useContext, useState } from "react";
import ScenarioContext from "../../context/ScenarioContext";
import styles from "./ShareModal.module.scss";

/**
 * Component used to a display a share model on the screen, conisting of a copiable link and a button.
 *
 * @component
 * @example
 * const isOpen = false
 * function handleClose() {
 *   console.log("Closed.")
 * }
 * return (
 *   <ShareModal isOpen={isOpen} handleClose={handleClose} />
 * )
 */
export default function ShareModal({ isOpen, handleClose }) {
  const { currentScenario } = useContext(ScenarioContext);
  const [copySuccess, setCopySuccess] = useState(false);
  const url = `${window.location.origin}/play/${currentScenario._id}`;

  /** Function which executes when the modal is closed. */
  function onClose() {
    handleClose();
    setCopySuccess(false);
  }

  return (
    <div>
      <dialog
        id="share_modal"
        className={`modal ${isOpen ? "modal-open" : ""}`}
      >
        <form
          method="dialog"
          className="modal-box relative flex flex-col items-center justify-center"
          style={{
            backgroundColor: "white",
            color: "black",
            borderRadius: "10px",
          }}
        >
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={onClose}
          >
            ✕
          </button>
          <h3 className="font-bold text-lg text-center mb-4 text-black">
            Shareable Link
          </h3>
          <div className="w-full">
            <p className="text-center text-black mb-4">
              Give this link to others so they can play this scenario
            </p>
            <input
              type="text"
              value={url}
              readOnly
              onFocus={(e) => e.target.select()}
              className="input input-bordered w-full mb-4 text-center"
              style={{
                backgroundColor: "white",
                color: "black",
                borderRadius: "5px",
              }}
            />
            <div className="flex justify-center">
              <Button
                className={`btn contained white ${styles.dialogItem}`}
                autoFocus
                onClick={() => {
                  navigator.clipboard.writeText(url);
                  setCopySuccess(true);
                }}
                color="primary"
              >
                {copySuccess ? "Copied!" : "Copy Link"}
              </Button>
            </div>
          </div>
          <div className="modal-action"></div>
        </form>
      </dialog>
    </div>
  );
}
