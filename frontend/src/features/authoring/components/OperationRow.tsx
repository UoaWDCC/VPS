import { XIcon } from "lucide-react";
import useEditorStore from "../stores/editor";
import type { Operation, PropertyOperationType } from "../types";
import SelectInput from "./Select";
import {
  getDefaultValue,
  propertyTypes,
  validOperations,
} from "../../../components/Properties/propertyTypes";

interface OperationRowType {
  item: Operation;
  onChange: (item: Operation) => void;
  onBlur: () => void;
  onDelete: () => void;
}

function OperationRow({
  item: operation,
  onChange,
  onDelete,
  onBlur,
}: OperationRowType) {
  const isDraft = operation.id === "";

  const properties = useEditorStore((s) => s.properties);

  const activeProperty = isDraft
    ? null
    : properties.find((p) => p.id === operation.stateVariableId)!;
  const operations = activeProperty
    ? (validOperations[activeProperty.type] as PropertyOperationType[])
    : [];

  // TODO: extract this out into a form / input handling module
  function onFieldChange<T extends keyof Operation>(field: T) {
    return function(value: Operation[T]) {
      if (isDraft) {
        const property = properties.find((p) => p.id === value)!;
        onChange({
          ...operation,
          stateVariableId: value as string,
          operation: "set",
          value: getDefaultValue(property.type),
        });
        return;
      }
      if (field === "stateVariableId") {
        const property = properties.find((p) => p.id === value)!;
        if (property.type !== activeProperty!.type) {
          onChange({
            ...operation,
            stateVariableId: value as string,
            operation: "set",
            value: getDefaultValue(property.type),
          });
          return;
        }
      }
      if (field === "value") {
        let casted = value as Operation["value"];
        if (activeProperty!.type === propertyTypes.BOOLEAN) {
          casted = value === "true";
        } else if (activeProperty!.type === propertyTypes.NUMBER) {
          casted = Number(value);
        }
        onChange({ ...operation, value: casted });
        return;
      }
      onChange({ ...operation, [field]: value });
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
            values={operations}
            value={operation.operation ?? null}
            onChange={onFieldChange("operation")}
          />
          {activeProperty?.type === propertyTypes.BOOLEAN ? (
            <SelectInput
              disabled={!activeProperty}
              values={["true", "false"]}
              value={operation.value}
              onChange={onFieldChange("value")}
            />
          ) : (
            <input
              disabled={!activeProperty}
              type={activeProperty?.type ?? "string"}
              value={operation.value as string | number}
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

export default OperationRow;
