import { XIcon } from "lucide-react";
import useEditorStore from "../stores/editor";
import type { Comparator, Condition } from "../types";
import SelectInput from "./Select";
import {
  getDefaultValue,
  propertyTypes,
  validComparators,
} from "../../../components/Properties/propertyTypes";

interface ConditionRowType {
  item: Condition;
  onChange: (item: Condition) => void;
  onBlur: () => void;
  onDelete: () => void;
}

function ConditionRow({
  item: condition,
  onChange,
  onDelete,
  onBlur,
}: ConditionRowType) {
  const isDraft = condition.id === "";

  const properties = useEditorStore((s) => s.properties);

  const activeProperty = isDraft
    ? null
    : properties.find((p) => p.id === condition.stateVariableId)!;
  const comparators = activeProperty
    ? (validComparators[activeProperty.type] as Comparator[])
    : [];

  // TODO: extract this out into a form / input handling module
  function onFieldChange<T extends keyof Condition>(field: T) {
    return function(value: Condition[T]) {
      if (isDraft) {
        const property = properties.find((p) => p.id === value)!;
        onChange({
          ...condition,
          stateVariableId: value as string,
          comparator: "=",
          value: getDefaultValue(property.type),
        });
        return;
      }
      if (field === "stateVariableId") {
        const property = properties.find((p) => p.id === value)!;
        if (property.type !== activeProperty!.type) {
          onChange({
            ...condition,
            stateVariableId: value as string,
            comparator: "=",
            value: getDefaultValue(property.type),
          });
          return;
        }
      }
      if (field === "value") {
        let casted = value as Condition["value"];
        if (activeProperty!.type === propertyTypes.BOOLEAN) {
          casted = value === "true";
        } else if (activeProperty!.type === propertyTypes.NUMBER) {
          casted = Number(value);
        }
        onChange({ ...condition, value: casted });
        return;
      }
      onChange({ ...condition, [field]: value });
    };
  }

  return (
    <li>
      <div className="flex items-center">
        <div className="flex items-center join flex-1">
          <SelectInput
            values={properties}
            display={(p) => p.name}
            value={activeProperty ?? null}
            onChange={(p) => onFieldChange("stateVariableId")(p.id)}
            autoFocus={isDraft}
            onBlur={onBlur}
          />
          <SelectInput
            disabled={!activeProperty}
            values={comparators}
            value={condition.comparator ?? null}
            onChange={onFieldChange("comparator")}
          />
          {activeProperty?.type === propertyTypes.BOOLEAN ? (
            <SelectInput
              disabled={!activeProperty}
              values={["true", "false"]}
              value={condition.value}
              onChange={onFieldChange("value")}
            />
          ) : (
            <input
              disabled={!activeProperty}
              type={activeProperty?.type ?? "string"}
              value={condition.value as string | number}
              onChange={(e) => onFieldChange("value")(e.target.value)}
              className="input join-item disabled:opacity-50 disabled:bg-base-100 disabled:border-base-content/20"
            />
          )}
        </div>
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

export default ConditionRow;
