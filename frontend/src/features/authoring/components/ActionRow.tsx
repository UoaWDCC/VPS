import { GripVerticalIcon, XIcon } from "lucide-react";
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: actionRef.id || "draft", disabled: isDraft });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      className={`group -mx-5 ${isDragging ? "bg-base-300" : ""}`}
      style={style}
      ref={setNodeRef}
    >
      <div className="flex gap-2 items-center px-5 py-0.5">
        <div
          className={`w-6 h-6 flex items-center justify-center ${isDraft ? "" : isDragging ? "cursor-grabbing touch-none" : "cursor-grab touch-none"}`}
          {...attributes}
          {...listeners}
        >
          <span
            className={`text-xs ${isDragging ? "hidden" : "group-hover:hidden"}`}
          >
            {index + 1}
          </span>
          <GripVerticalIcon
            size={14}
            className={isDragging ? "block" : "hidden group-hover:block"}
          />
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
