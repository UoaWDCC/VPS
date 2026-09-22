import { XIcon } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";
import type { Action, ActionRef } from "../types";
import SelectInput from "./Select";
import useVisualScene from "../stores/visual";

interface ActionsInputProps {
  items: ActionRef[];
  onDelete: (id: string) => void;
  onReorder: (updated: ActionRef[]) => void;
}

export interface ActionsInputHandle {
  addItem: () => void;
}

function nextIndex(items: ActionRef[]) {
  return items.reduce((max, ref) => Math.max(max, ref.index), -1) + 1;
}

const ActionsInput = forwardRef<ActionsInputHandle, ActionsInputProps>(
  function ActionsInput({ items, onDelete, onReorder }, ref) {
    const actions = useVisualScene((s) => s.actions);
    const [hasDraft, setHasDraft] = useState(false);

    useImperativeHandle(ref, () => ({
      addItem() {
        setHasDraft(true);
      },
    }));

    const sorted = [...items].sort((a, b) => a.index - b.index);
    const rows = hasDraft
      ? [...sorted, { id: "", index: nextIndex(items) }]
      : sorted;

    function handleChange(id: string, action: Action | null) {
      if (id === "") {
        if (action) {
          onReorder([...items, { id: action.id, index: nextIndex(items) }]);
        }
        setHasDraft(false);
        return;
      }

      onReorder(
        items.map((actionRef) =>
          actionRef.id === id
            ? { ...actionRef, id: action?.id ?? actionRef.id }
            : actionRef
        )
      );
    }

    function handleBlur(id: string) {
      if (id === "") setHasDraft(false);
    }

    function handleDelete(id: string) {
      if (id === "") {
        setHasDraft(false);
        return;
      }
      onDelete(id);
    }

    return (
      <div className="dropdown flex-1">
        <ul>
          {rows.map((actionRef, i) => (
            <li key={actionRef.id || "draft"}>
              <div className="flex gap-2 items-center">
                <div className="w-6 h-6 flex items-center justify-center">
                  <span className="text-xs">{i + 1}</span>
                </div>
                <SelectInput
                  values={actions}
                  display={(a) => a.name}
                  value={actions.find((a) => a.id === actionRef.id) ?? null}
                  onChange={(action) => handleChange(actionRef.id, action)}
                  onBlur={() => handleBlur(actionRef.id)}
                  autoFocus={actionRef.id === ""}
                />
                <button
                  className="btn btn-phantom btn-square btn-xs"
                  onClick={() => handleDelete(actionRef.id)}
                >
                  <XIcon size={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }
);

export default ActionsInput;
