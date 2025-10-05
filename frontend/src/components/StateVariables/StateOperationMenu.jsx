import { Typography } from "@material-ui/core";
import CreateStateOperation from "./CreateStateOperation";
import EditStateOperation from "./EditStateOperation";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import SelectInput from "../../features/authoring/components/Select";

/*
 * Component that houses state operation interface (methods for creating and editing)
 *
 * @component
 */
const StateOperationMenu = ({ component }) => {

  function createNew() {
    document.getElementById('create_modal').showModal();
  }

  return (
    <>
      <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
        <input type="checkbox" />
        <div className="collapse-title flex items-center justify-between">
          State Operations
          <PlusIcon size={18} onClick={createNew} className="z-1" />
        </div>
        <div className="collapse-content text--1 bg-base-200 px-0">
          {/* <CreateStateOperation component={component} /> */}
          {component?.stateOperations?.map((operation, i) => (
            <EditStateOperation
              component={component}
              operationIndex={i}
              stateOperation={operation}
              key={i}
            />
          ))}
        </div>
      </div>
      <dialog id="create_modal" className="modal">
        <CreateStateOperation component={component} />
      </dialog>
    </>
  );
};

export default StateOperationMenu;
