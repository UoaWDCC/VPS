import { XIcon } from "lucide-react";
import useEditorStore from "../../stores/editor";
import type { PropertyOperationType } from "../../types";
import {
  propertyTypes,
  validOperations,
} from "../../../../components/Properties/propertyTypes";
import SelectInput from "../../components/Select";
import useField from "../../inputs/useField";

interface OperationRowType {
  locator: string;
  id: string;
  onDelete: (id: string) => void;
}

function OperationRow({ locator, id, onDelete }: OperationRowType) {
  const properties = useEditorStore((s) => s.properties);

  const stateVariableField = useField(`${locator}.stateVariableId`, {
    commit: "onChange",
  });
  const operationField = useField(`${locator}.operation`, {
    commit: "onChange",
  });
  const valueField = useField(`${locator}.value`);

  const activeProperty = properties.find(
    (p) => p.id === stateVariableField.props.value
  )!;
  const operations = activeProperty
    ? (validOperations[activeProperty.type] as PropertyOperationType[])
    : [];

  return (
    <li>
      <div className="flex items-center">
        <div className="flex items-center join flex-1">
          <SelectInput
            {...stateVariableField.props}
            values={properties.map((p) => p.id)}
            display={(id) => properties.find((p) => p.id === id)!.name}
          />
          <SelectInput
            {...operationField.props}
            values={operations}
            disabled={!activeProperty}
          />
          {activeProperty?.type === propertyTypes.BOOLEAN ? (
            <SelectInput
              disabled={!activeProperty}
              values={["true", "false"]}
              {...valueField.props}
            />
          ) : (
            <input
              {...valueField.props}
              disabled={!activeProperty}
              type={activeProperty?.type ?? "string"}
              className="input join-item disabled:opacity-50 disabled:bg-base-100 disabled:border-base-content/20"
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

export default OperationRow;
