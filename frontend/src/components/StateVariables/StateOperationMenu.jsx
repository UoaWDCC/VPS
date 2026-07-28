import CreateStateOperation from "./CreateStateOperation";
import EditStateOperation from "./EditStateOperation";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

/*
 * Component that houses state operation interface (methods for creating and editing)
 *
 * @component
 */
const StateOperationMenu = ({ component }) => {
  const [createOpen, setCreateOpen] = useState(false);

  const stateOperations = component?.stateOperations ?? [];
  const hasStateOperations = stateOperations.length > 0;

  function createNew() {
    setCreateOpen(true);
  }

  return (
    <>
      <div
        className={`collapse overflow-visible ${
          hasStateOperations ? "collapse-arrow" : ""
        } bg-base-300 rounded-sm text-s`}
      >
        {hasStateOperations && <input type="checkbox" />}

        <div
          className={`collapse-title flex items-center justify-between ${
            hasStateOperations ? "" : "pe-4"
          }`}
        >
          State Operations
          <PlusIcon size={18} onClick={createNew} className="z-1" />
        </div>

        {hasStateOperations && (
          <div className="collapse-content text--1 bg-base-200 px-0">
            {stateOperations.map((operation, i) => (
              <EditStateOperation
                component={component}
                operationIndex={i}
                stateOperation={operation}
                key={i}
              />
            ))}
          </div>
        )}
      </div>
      <CreateStateOperation
        component={component}
        open={createOpen}
        setOpen={setCreateOpen}
      />
    </>
  );
};

export default StateOperationMenu;
