import CreateStateConditional from "./CreateStateConditional";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import EditStateConditional from "./EditStateConditional";

/**
 * Component that houses state conditional interface (methods for creating and editing)
 *
 * @component
 */
const StateConditionalMenu = ({ file, updateFile }) => {
  if (!file) {
    return null;
  }

  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
        <input type="checkbox" />
        <div className="collapse-title flex items-center justify-between">
          State Conditionals
          <PlusIcon
            size={18}
            onClick={() => setCreateOpen(true)}
            className="z-1"
          />
        </div>
        <div className="collapse-content text--1 bg-base-200 px-0">
          {file.stateConditionals?.map((stateConditional) => (
            <EditStateConditional
              fileId={file.id}
              conditional={stateConditional}
              conditionalId={stateConditional._id}
              key={stateConditional._id}
              updateFile={updateFile}
            />
          ))}
        </div>
      </div>
      <CreateStateConditional
        fileId={file.id}
        open={createOpen}
        setOpen={setCreateOpen}
        updateFile={updateFile}
      />
    </>
  );
};

export default StateConditionalMenu;
