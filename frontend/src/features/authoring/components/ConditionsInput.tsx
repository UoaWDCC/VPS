import { forwardRef, useImperativeHandle, useState } from "react";
import type { Condition } from "../types";
import ConditionRow from "./ConditionRow";
import { v4 } from "uuid";

interface ConditionsInputProps {
  items: Condition[];
  onChange: (updated: Condition[]) => void;
}

export interface ConditionsInputHandle {
  addItem: () => void;
}

const ConditionsInput = forwardRef<ConditionsInputHandle, ConditionsInputProps>(
  function ConditionsInput({ items, onChange }, ref) {

    const [hasDraft, setHasDraft] = useState<boolean>(false);

    const rows = hasDraft ? [...items, { id: "" }] as Condition[] : items;

    useImperativeHandle(ref, () => ({
      addItem() {
        setHasDraft(true);
      },
    }));

    function handleBlur(id: string) {
      if (id === "") setHasDraft(false);
    }

    function handleDelete(id: string) {
      if (id === "") {
        setHasDraft(false);
        return;
      }
      onChange(items.filter((c) => c.id !== id));
    }

    function handleChange(condition: Condition) {
      if (condition.id === "") {
        if (condition.stateVariableId) onChange([...items, { ...condition, id: v4() }]);
        setHasDraft(false);
        return;
      }
      onChange(items.map((c) => c.id === condition.id ? condition : c));
    }

    return (
      <div className="dropdown flex-1">
        <ul>
          {rows.map((condition) => (
            <ConditionRow
              key={condition.id || "draft"}
              condition={condition}
              onChange={handleChange}
              onBlur={() => handleBlur(condition.id)}
              onDelete={() => handleDelete(condition.id)}
            />
          ))}
        </ul>
      </div>
    );
  }
)

export default ConditionsInput;
