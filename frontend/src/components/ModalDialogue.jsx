import React from "react";

/**
 * Component used to a display a model on the screen.
 *
 * @component
 * @example
 * const title = "Title"
 * const dialogueAction = { ... }
 * const isShowing = false
 * function hide() {
 *   console.log("Hidden.")
 * }
 * return (
 *   <ModalDialogue title={title} dialogueAction={dialogueAction} isShowing={isShowing} hide={hide} >
 *     { ... }
 *   </ModalDialogue>
 * )
 */
export default function ModalDialogue({
  title,
  children,
  dialogueAction,
  isShowing,
  hide,
}) {
  return (
    <div>
      {isShowing && (
        <dialog id="modal" className="modal modal-open">
          <form method="dialog" className="modal-box relative max-w-lg">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-black"
              onClick={hide}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg text-black">{title}</h3>
            <div className="py-4 max-h-64 overflow-y-auto">
              {children}
            </div>
            <div className="modal-action fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg">
              {dialogueAction}
            </div>
          </form>
        </dialog>
      )}
    </div>
  );
}
