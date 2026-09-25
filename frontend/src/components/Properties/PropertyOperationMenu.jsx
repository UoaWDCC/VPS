import SceneContext from "../../context/SceneContext";
import SelectInput from "../../features/authoring/components/Select";
import { modifyComponentProp } from "../../features/authoring/scene/operations/component";
import CreatePropertyOperation from "./CreatePropertyOperation";
import EditPropertyOperation from "./EditPropertyOperation";
import { PlusIcon } from "lucide-react";
import { useContext, useEffect, useState } from "react";

/*
 * The content of the "Property Operations" panel (methods for creating and editing)
 *
 * @component
 */
const PropertyOperationMenu = ({ component }) => {
  const [createOpen, setCreateOpen] = useState(false);

  const propertyOperations = component?.stateOperations ?? [];
  const hasPropertyOperations = propertyOperations.length > 0;

  const { scenes } = useContext(SceneContext);

  const [value, setValue] = useState(component?.nextScene);

  useEffect(() => {
    if (component?.nextScene !== value) setValue(component?.nextScene);
  }, [component]);

  function saveLink(v) {
    if (!component) return;
    setValue(v);
    modifyComponentProp([component.id], "nextScene", v);
  }

  function createNew() {
    setCreateOpen(true);
  }

  return (
    <>
      <fieldset className="fieldset pt-2">
        <label className="label">Linked Scene</label>
        <SelectInput
          nullable
          values={scenes?.map((s) => s._id) ?? []}
          value={value}
          onChange={saveLink}
          display={(v) => scenes.find((s) => s._id === v)?.name}
        />
      </fieldset>
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
      <CreatePropertyOperation
        component={component}
        open={createOpen}
        setOpen={setCreateOpen}
      />
    </>
  );
};

export default PropertyOperationMenu;
