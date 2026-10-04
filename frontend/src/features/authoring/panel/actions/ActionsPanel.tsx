import { PlusIcon } from "lucide-react";
import { v4 as uuid } from "uuid";
import useVisualScene from "../../stores/visual";
import { modifySceneProp } from "../../scene/operations/modifiers";
import ActionRow from "./ActionRow";
import { nextNumberedName } from "../../util";

/*
 * The content of the "Actions" panel.
 *
 * @component
 */
function ActionsPanel() {
  const actions = useVisualScene((s) => s.actions);

  function handleCreate() {
    modifySceneProp("actions", [
      ...actions,
      {
        id: uuid(),
        name: nextNumberedName(
          "New Action",
          actions.map((a) => a.name)
        ),
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
      {actions.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-3">
          {actions.map((action, i) => (
            <ActionRow
              key={action.id}
              id={action.id}
              index={i}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-xs text-center text-primary">
          No actions yet for this scene
        </p>
      )}
    </>
  );
}

export default ActionsPanel;
