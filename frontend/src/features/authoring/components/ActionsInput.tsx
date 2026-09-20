import { XIcon } from "lucide-react";
import type { ActionRef } from "../types";
import SelectInput from "./Select";
import useVisualScene from "../stores/visual";

interface ActionsInputProps {
  items: ActionRef[];
  onDelete: (id: string) => void;
  onReorder: (updated: ActionRef[]) => void;
}

function ActionsInput({ items, onDelete, onReorder }: ActionsInputProps) {

  const actions = useVisualScene(s => s.actions);

  function handleDelete(id: string) {
    onDelete(id);
  }

  return (
    <div className="dropdown flex-1">
      <ul>
        {items.map((ref) => (
          <li key={ref.id}>
            <div className="flex">
              <span>1</span>
              <SelectInput
                nullable
                values={actions}
                display={(a) => a.name}
                value={null}
                onChange={console.log}
              />
              <button onClick={() => handleDelete(ref.id)}>
                <XIcon size={20} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ActionsInput;
