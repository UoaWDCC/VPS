import CreateStateConditional from "./CreateStateConditional";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import EditStateConditional from "./EditStateConditional";

const StateConditionalMenu = ({ resource }) => {
  const [createOpen, setCreateOpen] = useState(false);

  if (!resource) return null;

  return (
    <>
      <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
        <input type="checkbox" />
        <div className="collapse-title flex items-center justify-between">
          Visibility Conditionals
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
          {resource.stateConditionals?.map((stateConditional) => (
            <EditStateConditional
              resource={resource}
              conditional={stateConditional}
              key={stateConditional._id}
            />
          ))}
        </div>
      </div>
      <CreateStateConditional
        resource={resource}
        open={createOpen}
        setOpen={setCreateOpen}
      />
    </>
  );
};

export default StateConditionalMenu;
