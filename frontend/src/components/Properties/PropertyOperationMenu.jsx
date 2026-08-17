import CreatePropertyOperation from "./CreatePropertyOperation";
import EditPropertyOperation from "./EditPropertyOperation";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

/*
 * Component that houses property operation interface (methods for creating and editing)
 *
 * @component
 */
const PropertyOperationMenu = ({ component }) => {
  const [createOpen, setCreateOpen] = useState(false);

  const propertyOperations = component?.stateOperations ?? [];
  const hasPropertyOperations = propertyOperations.length > 0;

  function createNew() {
    setCreateOpen(true);
  }

  return (
    <>
      <div
        className={`collapse overflow-visible ${
          hasPropertyOperations ? "collapse-arrow" : ""
        } bg-base-300 rounded-sm text-s`}
      >
        {hasPropertyOperations && <input type="checkbox" />}

        <div
          className={`collapse-title flex items-center justify-between ${
            hasPropertyOperations ? "" : "pe-4"
          }`}
        >
          Property Operations
          <PlusIcon size={18} onClick={createNew} className="z-1" />
        </div>

        {hasPropertyOperations && (
          <div className="collapse-content text--1 bg-base-200 px-0">
            {propertyOperations.map((operation, i) => (
              <EditPropertyOperation
                component={component}
                operationIndex={i}
                propertyOperation={operation}
                key={i}
              />
            ))}
          </div>
        )}
      </div>
      <CreatePropertyOperation
        component={component}
        open={createOpen}
        setOpen={setCreateOpen}
      />
    </>
  );
};

export default PropertyOperationMenu;
