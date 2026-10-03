import { useContext, useRef, useState, type Context } from "react";
import SceneContext from "../../../../context/SceneContext";
import type { Scene } from "../../types";
import useField from "../../inputs/useField";
import { ChevronDownIcon, ChevronUpIcon, XIcon } from "lucide-react";
import SceneSelectInput from "../../components/SceneSelectInput";
import PanelInput from "../PanelInput";
import { coerceUniqueName } from "../../inputs/coerce";
import useVisualScene from "../../stores/visual";
import { cn } from "../../../../util/classnames";
import ListInput, { type ListInputHandle } from "./ListInput";
import ConditionRowDraft from "./ConditionRowDraft";
import ConditionRow from "./ConditionRow";
import OperationRowDraft from "./OperationRowDraft";
import OperationRow from "./OperationRow";

interface ActionRowProps {
  onDelete: (id: string) => void;
  index: number;
  id: string;
}

function ActionRow({ id, index, onDelete }: ActionRowProps) {
  const { scenes } = useContext(SceneContext as Context<{ scenes: Scene[] }>);
  const [expanded, setExpanded] = useState<boolean>(false);
  const actions = useVisualScene((s) => s.actions);

  const nameField = useField<string>(`actions.${index}.name`, {
    coerce: coerceUniqueName(actions.map((a) => a.name)),
  });
  const linkedSceneField = useField<string | null>(
    `actions.${index}.linkedScene`,
    { commit: "onChange", empty: null }
  );

  function toggleExpansion() {
    setExpanded((prev) => !prev);
  }

  const conditionsInputRef = useRef<ListInputHandle | null>(null);
  const operationsInputRef = useRef<ListInputHandle | null>(null);

  return (
    <li key={id} className="-mx-5 group flex flex-col gap-2 py-1.5">
      <div className="flex gap-2 items-center px-5">
        <input
          {...nameField.props}
          type="text"
          className={cn("input", nameField.error && "input-error")}
          placeholder="Awesome Action"
        />
        <button
          className="btn btn-phantom btn-square btn-xs"
          onClick={() => onDelete(id)}
        >
          <XIcon size={20} />
        </button>
        <button
          className="btn btn-phantom btn-square btn-xs"
          onClick={toggleExpansion}
        >
          {expanded ? (
            <ChevronUpIcon size={20} />
          ) : (
            <ChevronDownIcon size={20} />
          )}
        </button>
      </div>
      {expanded && (
        <div className="px-5 ml-5 border-l-1 border-base-content/20">
          <div className="flex flex-col gap-2">
            <PanelInput label="Linked Scene">
              <SceneSelectInput scenes={scenes} {...linkedSceneField.props} />
            </PanelInput>
            <PanelInput
              label="Conditions"
              onAdd={() => conditionsInputRef.current?.addItem()}
            >
              <ListInput
                ref={(e) => (conditionsInputRef.current = e)}
                locator={`actions.${index}.conditions`}
                Row={ConditionRow}
                DraftRow={ConditionRowDraft}
              />
            </PanelInput>
            <PanelInput
              label="Operations"
              onAdd={() => operationsInputRef.current?.addItem()}
            >
              <ListInput
                ref={(e) => (operationsInputRef.current = e)}
                locator={`actions.${index}.operations`}
                Row={OperationRow}
                DraftRow={OperationRowDraft}
              />
            </PanelInput>
          </div>
        </div>
      )}
    </li>
  );
}

export default ActionRow;
