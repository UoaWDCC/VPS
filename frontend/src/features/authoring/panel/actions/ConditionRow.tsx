import { XIcon } from "lucide-react";
import useEditorStore from "../../stores/editor";
import type { Comparator } from "../../types";
import {
  propertyTypes,
  validComparators,
} from "../../../../components/Properties/propertyTypes";
import SelectInput from "../../components/Select";
import useField from "../../inputs/useField";

interface ConditionRowType {
  locator: string;
  id: string;
  onDelete: (id: string) => void;
}

function ConditionRow({ locator, id, onDelete }: ConditionRowType) {
  const properties = useEditorStore((s) => s.properties);

  const stateVariableField = useField(`${locator}.stateVariableId`, {
    commit: "onChange",
  });
  const comparatorField = useField(`${locator}.comparator`, {
    commit: "onChange",
  });
  const valueField = useField(`${locator}.value`);

  const activeProperty = properties.find(
    (p) => p.id === stateVariableField.props.value
  )!;
  const comparators = activeProperty
    ? (validComparators[activeProperty.type] as Comparator[])
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
            {...comparatorField.props}
            values={comparators}
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

export default ConditionRow;
