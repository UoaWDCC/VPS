import CreateStateConditional from "./CreateStateConditional";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import EditStateConditional from "./EditStateConditional";

/**
 * Component that houses state conditional interface (methods for creating and editing)
 *
 * @component
 */
const StateConditionalMenu = ({ file }) => {
  if (!file) {
    return null;
  }

  const [createOpen, setCreateOpen] = useState(false);
  const [conditionals, setConditionals] = useState([]);

  useEffect(() => {
    setConditionals(file.stateConditionals || []);
    console.log(conditionals);
  }, [file]);

  return (
    <>
      <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
        <input type="checkbox" />
        <div className="collapse-title flex items-center justify-between">
          State Operations
          <PlusIcon
            size={18}
            onClick={() => setCreateOpen(true)}
            className="z-1"
          />
        </div>
        <div className="collapse-content text--1 bg-base-200 px-0">
          {file.stateConditionals?.map(
            (stateConditional, stateConditionalIndex) => (
              <EditStateConditional
                file={file}
                conditional={stateConditional}
                conditionalIndex={stateConditionalIndex}
                key={stateConditionalIndex}
              />
            )
          )}
        </div>
      </div>
      <CreateStateConditional
        fileId={file.id}
        open={createOpen}
        setOpen={setCreateOpen}
      />
    </>
  );
};

export default StateConditionalMenu;
