import { useState } from "react";
import { PlusIcon } from "lucide-react";
import CreatePropertyBinding from "./CreatePropertyBinding";
import PropertyBinding from "./PropertyBinding";

export default function PropertyBindingMenu({ component }) {
  const [createOpen, setCreateOpen] = useState(false);
  const bindings = component?.stateBindings ?? [];

  return (
    <>
      <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
        <input type="checkbox" />
        <div className="collapse-title flex items-center justify-between">
          Property Bindings
          <PlusIcon
            size={18}
            className="z-1"
            onClick={(event) => {
              event.stopPropagation();
              setCreateOpen(true);
            }}
          />
        </div>
        <div className="collapse-content text--1 bg-base-200 px-0">
          {bindings.map((binding, index) => (
            <PropertyBinding
              component={component}
              binding={binding}
              key={`${binding.target}-${binding.stateVariableId}-${index}`}
            />
          ))}
        </div>
      </div>
      <CreatePropertyBinding
        component={component}
        open={createOpen}
        setOpen={setCreateOpen}
      />
    </>
  );
}
