import { XIcon } from "lucide-react";
import useEditorStore from "../../stores/editor";
import { getDefaultValue } from "../../../../components/Properties/propertyTypes";
import SelectInput from "../../components/Select";
import type { Operation } from "../../types";
import { v4 as uuid } from "uuid";

interface OperationRowDraftProps {
  onPublish: (operation: Operation) => void;
  onScrap: () => void;
}

function OperationRowDraft({ onPublish, onScrap }: OperationRowDraftProps) {
  const properties = useEditorStore((s) => s.properties);

  function publish(value: string) {
    const property = properties.find((p) => p.id === value)!;
    onPublish({
      id: uuid(),
      stateVariableId: value,
      operation: "set",
      value: getDefaultValue(property.type),
    });
  }

  return (
    <li>
      <div className="flex items-center">
        <div className="flex items-center join flex-1">
          <SelectInput
            value={null}
            values={properties.map((p) => p.id)}
            display={(id) => properties.find((p) => p.id === id)!.name}
            onChange={publish}
            autoFocus={true}
            onBlur={onScrap}
          />
          <SelectInput
            onChange={() => {}}
            value={null}
            values={[]}
            disabled={true}
          />
          <input value="" className="input join-item" disabled={true} />
        </div>
        <button className="btn btn-phantom btn-square btn-xs">
          <XIcon size={20} />
        </button>
      </div>
    </li>
  );
}

export default OperationRowDraft;
