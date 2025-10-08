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

  const [createOpen, setCreateOpen] = useState(false);

  function createNew() {
    setCreateOpen(true);
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
      <CreateStateOperation component={component} open={createOpen} setOpen={setCreateOpen} />
    </>
  );
};

export default StateOperationMenu;
