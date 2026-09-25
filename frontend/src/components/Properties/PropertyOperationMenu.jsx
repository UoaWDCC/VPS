import SceneContext from "../../context/SceneContext";
import PanelInput from "../../features/authoring/CanvasSideBar/PanelInput";
import ConditionRow from "../../features/authoring/components/ConditionRow";
import SceneSelectInput from "../../features/authoring/components/SceneSelectInput";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  GripVerticalIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { useContext, useRef, useState } from "react";
import useEditorStore from "../../features/authoring/stores/editor";
import ListInput from "../../features/authoring/components/ListInput";
import OperationRow from "../../features/authoring/components/OperationRow";
import { v4 } from "uuid";

/*
 * The content of the "Property Operations" panel (methods for creating and editing)
 *
 * @component
 */
function PropertyOperationMenu() {
  // const actions = useVisualScene((s) => s.actions);
  const { scenes } = useContext(SceneContext);
  const properties = useEditorStore(s => s.properties);

  const conditionsInputRef = useRef(null);
  const operationsInputRef = useRef(null);

  console.log(properties);

  const [actions, setActions] = useState([{ name: "yolatunde", id: "1232" }])

  const [conditions, setConditions] = useState([{ comparator: "!=", value: 5, stateVariableId: "6e708c29-d808-462d-a702-2e8abb485630", id: "1232" }]);
  const [operations, setOperations] = useState([{ operation: "add", value: 5, stateVariableId: "6e708c29-d808-462d-a702-2e8abb485630", id: "1232" }]);

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
    setActions(prev => [...prev, { id: v4(), name: "New Action" }])
  }

  return (
    <>
      <button
        type="button"
        className="btn px-1.5 py-1/2 bg-base-300 hover:bg-base-100 border-0 shadow-none text-xs font-normal h-7 w-full justify-start"
        onClick={handleCreate}
      >
        <PlusIcon size={18} />
        Create New Action
      </button>
      <ul className="mt-3">
        {actions.map((action) => (
          <li key={action.id} className="-mx-5 group flex flex-col gap-2 py-1.5">
            <div className="flex gap-2 items-center px-5">
              <div className="w-6 h-6 flex items-center justify-center">
                <GripVerticalIcon size={14} />
              </div>
              <input
                type="text"
                value={action.name}
                onChange={console.log}
                className="input"
                placeholder="Awesome Action"
              />
              <button
                className="btn btn-phantom btn-square btn-xs"
                onClick={console.log}
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
                <div className="flex flex-col gap-2">
                  <PanelInput label="Linked Scene">
                    <SceneSelectInput
                      scenes={scenes}
                      value={null}
                      onChange={console.log}
                    />
                  </PanelInput>
                  <PanelInput label="Conditions" onAdd={() => conditionsInputRef.current?.addItem()}>
                    <ListInput
                      ref={conditionsInputRef}
                      items={conditions}
                      onChange={setConditions}
                      Row={ConditionRow}
                      requiredField="stateVariableId"
                    />
                  </PanelInput>
                  <PanelInput label="Operations" onAdd={() => operationsInputRef.current?.addItem()}>
                    <ListInput
                      ref={operationsInputRef}
                      items={operations}
                      onChange={setOperations}
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
