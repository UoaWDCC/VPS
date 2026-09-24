import SceneContext from "../../context/SceneContext";
import PanelInput from "../../features/authoring/CanvasSideBar/PanelInput";
import SceneSelectInput from "../../features/authoring/components/SceneSelectInput";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  GripVerticalIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { useContext, useState } from "react";

/*
 * The content of the "Property Operations" panel (methods for creating and editing)
 *
 * @component
 */
function PropertyOperationMenu() {
  // const actions = useVisualScene((s) => s.actions);
  const { scenes } = useContext(SceneContext);

  const actions = [{ name: "yolatunde", id: "1232" }];

  const [expandedActions, setExpandedActions] = useState([]);

  function toggleExpansion(id) {
    setExpandedActions((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function isExpanded(id) {
    return expandedActions.includes(id);
  }

  return (
    <>
      <button
        type="button"
        className="btn px-1.5 py-1/2 bg-base-300 hover:bg-base-100 border-0 shadow-none text-xs h-7 w-full justify-start"
      >
        <PlusIcon size={18} />
        Create New Action
      </button>
      <ul className="mt-3">
        {actions.map((action) => (
          <li key={action.id} className="-mx-5 group flex flex-col gap-2">
            <div className="flex gap-2 items-center px-5">
              <div className="w-6 h-6 flex items-center justify-center">
                <GripVerticalIcon size={14} />
              </div>
              <input
                type="text"
                value={action.name}
                onChange={console.log}
                onBlur={console.log}
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
                  <ChevronDownIcon size={20} />
                ) : (
                  <ChevronUpIcon size={20} />
                )}
              </button>
            </div>
            {isExpanded(action.id) ? (
              <div className="px-5 pl-11">
                <div className="h-100">
                  <PanelInput label="Linked Scene">
                    <SceneSelectInput
                      scenes={scenes}
                      value={null}
                      onChange={console.log}
                    />
                  </PanelInput>
                  <PanelInput label="Conditions">
                    <SceneSelectInput
                      scenes={scenes}
                      value={null}
                      onChange={console.log}
                    />
                  </PanelInput>
                  <PanelInput label="Operations">
                    <SceneSelectInput
                      scenes={scenes}
                      value={null}
                      onChange={console.log}
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
