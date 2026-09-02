import CreatePropertyOperation from "./CreatePropertyOperation";
import EditPropertyOperation from "./EditPropertyOperation";
import { PlusIcon, ZapIcon } from "lucide-react";
import { useState } from "react";
import SidePanel from "../../features/authoring/CanvasSideBar/SidePanel";

/*
 * Component that houses property operation interface (methods for creating and editing)
 *
 * @component
 */
const PropertyOperationMenu = ({ component, open, onToggle }) => {
  const [createOpen, setCreateOpen] = useState(false);

  const propertyOperations = component?.stateOperations ?? [];
  const hasPropertyOperations = propertyOperations.length > 0;

  function createNew() {
    setCreateOpen(true);
  }

  return (
    <>
      <SidePanel
        label="Property Operations"
        Icon={ZapIcon}
        open={open}
        onToggle={onToggle}
      >
        <div className="mb-3">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm border-0 bg-base-300 px-3 py-2 text-left text-sm shadow-none transition-colors hover:bg-base-100"
            onClick={createNew}
          >
            <PlusIcon size={16} />
            Add Operation
          </button>
        </div>
        {hasPropertyOperations ? (
          <div className="text--1">
            {propertyOperations.map((operation, i) => (
              <EditPropertyOperation
                component={component}
                operationIndex={i}
                propertyOperation={operation}
                key={i}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs opacity-70">No property operations yet.</p>
        )}
      </SidePanel>
      <CreatePropertyOperation
        component={component}
        open={createOpen}
        setOpen={setCreateOpen}
      />
    </>
  );
};

export default PropertyOperationMenu;
