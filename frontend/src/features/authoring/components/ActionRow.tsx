import { XIcon } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Action, ActionRef } from "../types";
import SelectInput from "./Select";

interface ActionRowProps {
  actionRef: ActionRef;
  index: number;
  actions: Action[];
  onChange: (action: Action | null) => void;
  onBlur: () => void;
  onDelete: () => void;
}

function ActionRow({
  actionRef,
  index,
  actions,
  onChange,
  onBlur,
  onDelete,
}: ActionRowProps) {
  const isDraft = actionRef.id === "";

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: actionRef.id || "draft", disabled: isDraft });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li style={style} {...attributes} {...listeners} ref={setNodeRef}>
      <div className="flex gap-2 items-center">
        <div className="w-6 h-6 flex items-center justify-center">
          <span className="text-xs">{index + 1}</span>
        </div>
        <SelectInput
          values={actions}
          display={(a) => a.name}
          value={actions.find((a) => a.id === actionRef.id) ?? null}
          onChange={onChange}
          onBlur={onBlur}
          autoFocus={isDraft}
        />
        <button
          className="btn btn-phantom btn-square btn-xs"
          onClick={onDelete}
        >
          <XIcon size={20} />
        </button>
      </div>
    </li>
  );
}

export default ActionRow;
