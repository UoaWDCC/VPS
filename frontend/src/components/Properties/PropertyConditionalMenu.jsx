import CreatePropertyConditional from "./CreatePropertyConditional";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import EditPropertyConditional from "./EditPropertyConditional";

const PropertyConditionalMenu = ({ resource }) => {
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
            title="Create property conditional"
          >
            <PlusIcon size={18} />
          </button>
        </div>
        <div className="collapse-content text--1 bg-base-200 px-0">
          {resource.stateConditionals?.map((propertyConditional) => (
            <EditPropertyConditional
              resource={resource}
              conditional={propertyConditional}
              key={propertyConditional._id}
            />
          ))}
        </div>
      </div>
      <CreatePropertyConditional
        resource={resource}
        open={createOpen}
        setOpen={setCreateOpen}
      />
    </>
  );
};

export default PropertyConditionalMenu;
