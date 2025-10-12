import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// NOTE: this is unusual on purpose, so we get the full benefits of the native dialog element, notably esc behaviour and auto close for form buttons

function ModalDialog({ title, children, open, onClose, wide = false }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = (e) => {
      onClose?.(e);
    };

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  if (!open) return null;

  return createPortal(
    <dialog ref={dialogRef} id="modal" className="modal font-ibm">
      <form
        method="dialog"
        className={`modal-box flex flex-col text-m max-h-8/10 ${wide ? "max-w-[64rem]" : "overflow-y-visible"}`}
        tabIndex={0}
      >
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
          ✕
        </button>
        <h3 className="font-bold text-m">{title}</h3>
        <div className="mt-[0.5rem] min-h-0 flex-1 no-scrollbar">
          {children}
        </div>
      </form>
    </dialog>,
    document.getElementById("modal-portal")
  );
}

export default ModalDialog;
