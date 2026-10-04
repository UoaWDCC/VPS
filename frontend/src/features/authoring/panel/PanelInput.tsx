import { useState, type PropsWithChildren } from "react";
import { PlusIcon } from "lucide-react";

interface PanelInputProps {
  label?: string;
  AddModal?: (props: { open: boolean; onClose: () => void }) => JSX.Element;
  onAdd?: () => void;
}

function PanelInput({
  label,
  AddModal,
  onAdd,
  children,
}: PropsWithChildren<PanelInputProps>) {
  const [open, setOpen] = useState(false);

  function handleAddClick() {
    if (onAdd) onAdd();
    else setOpen(true);
  }

  return (
    <>
      <div className="flex flex-col w-full">
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
