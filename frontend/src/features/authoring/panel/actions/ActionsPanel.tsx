import { PlusIcon } from "lucide-react";
import { v4 } from "uuid";
import useVisualScene from "../../stores/visual";
import { modifySceneProp } from "../../scene/operations/modifiers";
import ActionRow from "./ActionRow";

/*
 * The content of the "Actions" panel.
 *
 * @component
 */
function ActionsPanel() {
  const actions = useVisualScene((s) => s.actions);

  // TODO: generate new name based on previous name (e.g. New Action 1..2..3)
  function handleCreate() {
    modifySceneProp("actions", [
      ...actions,
      {
        id: v4(),
        name: "New Action",
        linkedScene: null,
        conditions: [],
        operations: [],
      },
    ]);
  }

  function handleDelete(id: string) {
    modifySceneProp(
      "actions",
      actions.filter((a) => a.id !== id)
    );
  }

  return (
    <>
      <button type="button" className="btn btn-panel" onClick={handleCreate}>
        <PlusIcon size={18} />
        Create New Action
      </button>
      <ul className="mt-3">
        {actions.map((action, i) => (
          <ActionRow
            key={action.id}
            id={action.id}
            index={i}
            onDelete={handleDelete}
          />
        ))}
      </ul>
    </>
  );
}

export default ActionsPanel;
