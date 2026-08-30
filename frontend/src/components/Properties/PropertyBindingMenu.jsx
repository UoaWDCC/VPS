import { useState } from "react";
import { BracesIcon, PlusIcon } from "lucide-react";
import CreatePropertyBinding from "./CreatePropertyBinding";
import PropertyBinding from "./PropertyBinding";
import SidePanel from "../../features/authoring/CanvasSideBar/SidePanel";

export default function PropertyBindingMenu({ component, open, onToggle }) {
  const [createOpen, setCreateOpen] = useState(false);
  const bindings = component?.stateBindings ?? [];

  return (
    <>
      <SidePanel
        label="Property Bindings"
        Icon={BracesIcon}
        open={open}
        onToggle={onToggle}
      >
        <div className="mb-3">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm border-0 bg-base-300 px-3 py-2 text-left text-sm shadow-none transition-colors hover:bg-base-100"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon size={16} />
            Add Binding
          </button>
        </div>
        <div className="text--1">
          {bindings.map((binding, index) => (
            <PropertyBinding
              component={component}
              binding={binding}
              key={`${binding.target}-${binding.stateVariableId}-${index}`}
            />
          ))}
          {bindings.length === 0 && (
            <p className="text-xs opacity-70">No property bindings yet.</p>
          )}
        </div>
      </SidePanel>
      <CreatePropertyBinding
        component={component}
        open={createOpen}
        setOpen={setCreateOpen}
      />
    </>
  );
}
