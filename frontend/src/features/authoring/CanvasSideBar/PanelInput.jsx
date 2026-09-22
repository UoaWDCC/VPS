import { useState } from "react";
import { PlusIcon } from "lucide-react";

function PanelInput({ label, AddModal, onAdd, children }) {
  const [open, setOpen] = useState(false);

  function handleAddClick() {
    if (onAdd) onAdd();
    else setOpen(true);
  }

  return (
    <>
      <div className="flex flex-col">
        <div className="flex justify-between mb-1 h-6">
          <label className="label text-xs">{label}</label>
          {(AddModal || onAdd) && (
            <button
              type="button"
              className="btn btn-phantom btn-xs btn-square"
              onClick={handleAddClick}
            >
              <PlusIcon size={20} />
            </button>
          )}
        </div>
        {children}
      </div>
      {AddModal && <AddModal open={open} onClose={() => setOpen(false)} />}
    </>
  );
}

export default PanelInput;
