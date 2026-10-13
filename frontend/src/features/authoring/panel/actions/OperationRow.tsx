import { XIcon } from "lucide-react";
import useEditorStore from "../../stores/editor";
import type { PropertyOperationType, PropertyValue } from "../../types";
import {
  propertyTypes,
  validOperations,
} from "../../../../components/Properties/propertyTypes";
import SelectInput from "../../components/Select";
import useField from "../../inputs/useField";
import {
  coerceOneOf,
  coercePropertyExists,
  coercePropertyValue,
} from "../../inputs/coerce";
import { cn } from "../../../../util/classnames";

interface OperationRowProps {
  locator: string;
  id: string;
  onDelete: (id: string) => void;
}

function OperationRow({ locator, id, onDelete }: OperationRowProps) {
  const properties = useEditorStore((s) => s.properties);

  const stateVariableField = useField<string>(`${locator}.stateVariableId`, {
    commit: "onChange",
    coerce: coercePropertyExists(properties),
  });

  const activeProperty = properties.find(
    (p) => p.id === stateVariableField.props.value
  );
  const operations = activeProperty
    ? (validOperations[activeProperty.type] as PropertyOperationType[])
    : [];

  const operationField = useField<PropertyOperationType>(
    `${locator}.operation`,
    { commit: "onChange", empty: "set", coerce: coerceOneOf(operations) }
  );

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
            {...operationField.props}
            values={operations}
            disabled={!activeProperty}
            error={operationField.error}
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
          title="Delete Operation"
          aria-label="delete operation"
          className="btn btn-phantom btn-square btn-xs"
          onClick={() => onDelete(id)}
        >
          <XIcon size={20} />
        </button>
      </div>
    </li>
  );
}

export default OperationRow;
