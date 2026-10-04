import { XIcon } from "lucide-react";
import useEditorStore from "../../stores/editor";
import type { Comparator, PropertyValue } from "../../types";
import {
  propertyTypes,
  validComparators,
} from "../../../../components/Properties/propertyTypes";
import SelectInput from "../../components/Select";
import useField from "../../inputs/useField";
import {
  coerceOneOf,
  coercePropertyExists,
  coercePropertyValue,
} from "../../inputs/coerce";
import { cn } from "../../../../util/classnames";

interface ConditionRowProps {
  locator: string;
  id: string;
  onDelete: (id: string) => void;
}

function ConditionRow({ locator, id, onDelete }: ConditionRowProps) {
  const properties = useEditorStore((s) => s.properties);

  const stateVariableField = useField<string>(`${locator}.stateVariableId`, {
    commit: "onChange",
    coerce: coercePropertyExists(properties),
  });

  const activeProperty = properties.find(
    (p) => p.id === stateVariableField.props.value
  );
  const comparators = activeProperty
    ? (validComparators[activeProperty.type] as Comparator[])
    : [];

  const comparatorField = useField<Comparator>(`${locator}.comparator`, {
    commit: "onChange",
    empty: "=",
    coerce: coerceOneOf(comparators),
  });

  const valueField = useField<PropertyValue, string>(`${locator}.value`, {
    commit:
      activeProperty?.type === propertyTypes.BOOLEAN ? "onChange" : "onBlur",
    derive: String,
    coerce: coercePropertyValue(activeProperty?.type),
  });

  return (
    <li>
      <div className="flex gap-1 items-center">
        <div className="flex items-center join flex-1">
          <SelectInput
            {...stateVariableField.props}
            values={properties.map((p) => p.id)}
            display={(id) =>
              properties.find((p) => p.id === id)?.name ?? "Deleted Prop"
            }
            error={stateVariableField.error}
          />
          <SelectInput
            {...comparatorField.props}
            values={comparators}
            disabled={!activeProperty}
            error={comparatorField.error}
          />
          {activeProperty?.type === propertyTypes.BOOLEAN ? (
            <SelectInput
              disabled={!activeProperty}
              values={["true", "false"]}
              {...valueField.props}
              error={valueField.error}
            />
          ) : (
            <input
              {...valueField.props}
              disabled={!activeProperty}
              type="text"
              className={cn(
                "input join-item",
                valueField.error && "input-error"
              )}
            />
          )}
        </div>
        <button
          type="button"
          title="Delete Condition"
          aria-label="delete condition"
          className="btn btn-phantom btn-square btn-xs"
          onClick={() => onDelete(id)}
        >
          <XIcon size={20} />
        </button>
      </div>
    </li>
  );
}

export default ConditionRow;
