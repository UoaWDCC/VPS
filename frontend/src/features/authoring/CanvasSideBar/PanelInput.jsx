import { useState } from "react";
import { PlusIcon } from "lucide-react";

function PanelInput({ label, AddModal, children }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col">
        <div className="flex justify-between mb-1 h-6">
          <label className="label text-xs">{label}</label>
          {AddModal &&
            <button
              type="button"
              className="btn btn-phantom btn-xs btn-square"
              onClick={() => setOpen(true)}
            >
              <PlusIcon size={20} />
            </button>
          }
        </div>
        {children}
      </div>
      {AddModal &&
        <AddModal open={open} onClose={() => setOpen(false)} />
      }
    </>
  )
}

export default PanelInput;
