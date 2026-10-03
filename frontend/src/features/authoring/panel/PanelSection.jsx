import { PlusIcon } from "lucide-react";

function PanelSection({ name, id, onAdd, children }) {
  function handleAddClick() {
    if (onAdd) onAdd();
  }

  return (
    <section className="text-s mb-3" aria-labelledby={id}>
      <div className="flex justify-between">
        <h3 className="mb-3" id={id}>
          {name}
        </h3>
        {onAdd && (
          <button
            type="button"
            className="btn btn-phantom btn-xs btn-square"
            onClick={handleAddClick}
          >
            <PlusIcon size={20} />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

export default PanelSection;
