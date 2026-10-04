import { GripVerticalIcon, XIcon } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import useVisualScene from "../../stores/visual";
import useField from "../../inputs/useField";
import { cn } from "../../../../util/classnames";
import SelectInput from "../../components/Select";
import type { Action } from "../../types";
import { INVALID, type Coerced } from "../../inputs/coerce";

function coerceActionExists(actions: Action[]) {
  return (raw: string): Coerced<string> => {
    if (actions.find((a) => a.id === raw)) return raw;
    else return INVALID;
  };
}

interface ActionRefRowProps {
  locator: string;
  id: string;
  position: number;
  component?: string | null;
  onDelete: (id: string) => void;
}

function ActionRefRow({
  locator,
  id,
  position,
  component,
  onDelete,
}: ActionRefRowProps) {
  const actions = useVisualScene((s) => s.actions);

  const actionIdField = useField<string>(`${locator}.actionId`, {
    commit: "onChange",
    component,
    coerce: coerceActionExists(actions),
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

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
          className={cn(
            "w-6 h-6 flex items-center justify-center touch-none",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          {...attributes}
          {...listeners}
        >
          <span
            className={cn(
              "text-xs",
              isDragging ? "hidden" : "group-hover:hidden"
            )}
          >
            {position + 1}
          </span>
          <GripVerticalIcon
            size={14}
            className={isDragging ? "block" : "hidden group-hover:block"}
          />
        </div>
        <SelectInput
          {...actionIdField.props}
          values={actions.map((a) => a.id)}
          display={(id) =>
            actions.find((a) => a.id === id)?.name ?? "Deleted Action"
          }
          error={actionIdField.error}
        />
        <button
          className="btn btn-phantom btn-square btn-xs"
          onClick={() => onDelete(id)}
        >
          <XIcon size={20} />
        </button>
      </div>
    </li>
  );
}

export default ActionRefRow;
