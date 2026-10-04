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

interface ConditionRowType {
  locator: string;
  id: string;
  onDelete: (id: string) => void;
}

function ConditionRow({ locator, id, onDelete }: ConditionRowType) {
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
      <div className="flex items-center">
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
              type={activeProperty?.type ?? "string"}
              className={cn(
                "input join-item disabled:opacity-50 disabled:bg-base-100 disabled:border-base-content/20",
                valueField.error && "input-error"
              )}
            />
          )}
        </div>
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

export default ConditionRow;
