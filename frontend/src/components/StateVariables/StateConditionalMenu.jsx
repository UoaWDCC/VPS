import CreateStateConditional from "./CreateStateConditional";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import EditStateConditional from "./EditStateConditional";

/**
 * Component that houses state conditional interface (methods for creating and editing)
 *
 * @component
 */
const StateConditionalMenu = ({
  target,
  title = "State Conditionals",
  endpoint,
  updateTarget,
  file,
  updateFile,
}) => {
  const [createOpen, setCreateOpen] = useState(false);

  const subject = target || file;
  const conditionEndpoint =
    endpoint || (subject ? `/api/files/state-conditionals/${subject.id}` : "");
  const handleUpdate = updateTarget || updateFile;

  if (!subject) {
    return null;
  }

  return (
    <>
      <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
        <input type="checkbox" />
        <div className="collapse-title flex items-center justify-between">
          {title}
          <button
            type="button"
            className="btn btn-phantom btn-xs relative z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCreateOpen(true);
            }}
            title="Create state conditional"
          >
            <PlusIcon size={18} />
          </button>
        </div>
        <div className="collapse-content text--1 bg-base-200 px-0">
          {subject.stateConditionals?.map((stateConditional) => (
            <EditStateConditional
              endpoint={conditionEndpoint}
              conditional={stateConditional}
              conditionalId={stateConditional._id}
              key={stateConditional._id}
              updateTarget={handleUpdate}
            />
          ))}
        </div>
      </div>
      <CreateStateConditional
        endpoint={conditionEndpoint}
        open={createOpen}
        setOpen={setCreateOpen}
        updateTarget={handleUpdate}
      />
    </>
  );
};

export default StateConditionalMenu;
