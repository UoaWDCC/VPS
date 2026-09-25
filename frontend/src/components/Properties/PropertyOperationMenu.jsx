import SceneContext from "../../context/SceneContext";
import PanelInput from "../../features/authoring/CanvasSideBar/PanelInput";
import ConditionRow from "../../features/authoring/components/ConditionRow";
import SceneSelectInput from "../../features/authoring/components/SceneSelectInput";
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, XIcon } from "lucide-react";
import { useContext, useRef, useState } from "react";
import ListInput from "../../features/authoring/components/ListInput";
import OperationRow from "../../features/authoring/components/OperationRow";
import { v4 } from "uuid";
import { modifySceneProp } from "../../features/authoring/scene/operations/modifiers";
import useVisualScene from "../../features/authoring/stores/visual";

/*
 * The content of the "Property Operations" panel (methods for creating and editing)
 *
 * @component
 */
function PropertyOperationMenu() {
  const actions = useVisualScene((s) => s.actions);
  const { scenes } = useContext(SceneContext);

  const conditionsInputRef = useRef(null);
  const operationsInputRef = useRef(null);

  const [expandedActions, setExpandedActions] = useState([]);

  function toggleExpansion(id) {
    setExpandedActions((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function isExpanded(id) {
    return expandedActions.includes(id);
  }

  function handleCreate() {
    modifySceneProp("actions", [...actions, { id: v4(), name: "New Action" }])
  }

  function handleDelete(id) {
    modifySceneProp("actions", actions.filter(a => a.id !== id))
  }

  function handleChange(id, field) {
    return function(value) {
      modifySceneProp("actions", actions.map(a => a.id === id ? { ...a, [field]: value } : a))
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-panel"
        onClick={handleCreate}
      >
        <PlusIcon size={18} />
        Create New Action
      </button>
      <ul className="mt-3">
        {actions.map((action) => (
          <li key={action.id} className="-mx-5 group flex flex-col gap-2 py-1.5">
            <div className="flex gap-2 items-center px-5">
              <input
                type="text"
                value={action.name}
                onChange={(e) => handleChange(action.id, "name")(e.target.value)}
                className="input"
                placeholder="Awesome Action"
              />
              <button
                className="btn btn-phantom btn-square btn-xs"
                onClick={() => handleDelete(action.id)}
              >
                <XIcon size={20} />
              </button>
              <button
                className="btn btn-phantom btn-square btn-xs"
                onClick={() => toggleExpansion(action.id)}
              >
                {isExpanded(action.id) ? (
                  <ChevronUpIcon size={20} />
                ) : (
                  <ChevronDownIcon size={20} />
                )}
              </button>
            </div>
            {isExpanded(action.id) ? (
              <div className="px-5 pl-11">
                <div className="flex flex-col gap-2"  >
                  <PanelInput label="Linked Scene">
                    <SceneSelectInput
                      scenes={scenes}
                      value={action.linkedScene}
                      onChange={handleChange(action.id, "linkedScene")}
                    />
                  </PanelInput>
                  <PanelInput label="Conditions" onAdd={() => conditionsInputRef.current?.addItem()}>
                    <ListInput
                      ref={conditionsInputRef}
                      items={action.conditions ?? []}
                      onChange={handleChange(action.id, "conditions")}
                      Row={ConditionRow}
                      requiredField="stateVariableId"
                    />
                  </PanelInput>
                  <PanelInput label="Operations" onAdd={() => operationsInputRef.current?.addItem()}>
                    <ListInput
                      ref={operationsInputRef}
                      items={action.operations ?? []}
                      onChange={handleChange(action.id, "operations")}
                      Row={OperationRow}
                      requiredField="stateVariableId"
                    />
                  </PanelInput>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}

export default PropertyOperationMenu;
