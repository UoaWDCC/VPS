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
          <form method="dialog" className="modal-box relative max-w-lg flex flex-col items-center">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-black"
              onClick={hide}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg text-center text-black">{title}</h3>
            <div className="py-4 max-h-64 overflow-y-auto overflow-x-hidden text-center">
              {children}
            </div>
            <div className="modal-action w-full flex justify-center">
              {dialogueAction}
            </div>
          </form>
        </dialog>
      )}
    </div>
  );
}
