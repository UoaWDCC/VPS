import { useContext, useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";
import ScenarioContext from "context/ScenarioContext";
import { stateTypes } from "./stateTypes";
import { modifySceneProp } from "../../features/authoring/scene/operations/modifiers";
import useVisualScene from "../../features/authoring/stores/visual";
import CreateTimerOperationModal, {
  OperationField,
} from "./CreateTimerOperationModal";

function TimerOperationRow({ operation, index }) {
  const { stateVariables } = useContext(ScenarioContext);

  const stateVariable = stateVariables?.find(
    (v) => v.id === operation.stateVariableId
  );

  const [localOperation, setLocalOperation] = useState(operation.operation);
  const [localValue, setLocalValue] = useState(operation.value);

  useEffect(() => {
    setLocalOperation(operation.operation);
    setLocalValue(operation.value);
  }, [operation]);

  if (!stateVariable) return null;

  function getCurrent() {
    return useVisualScene.getState().timerStateOperations ?? [];
  }

  function saveOperation(v) {
    setLocalOperation(v);
    modifySceneProp(
      "timerStateOperations",
      getCurrent().map((op, i) => (i === index ? { ...op, operation: v } : op))
    );
  }

  function saveValue(v) {
    modifySceneProp(
      "timerStateOperations",
      getCurrent().map((op, i) => (i === index ? { ...op, value: v } : op))
    );
  }

  function handleValueChange(v) {
    setLocalValue(v);
    if (stateVariable.type === stateTypes.BOOLEAN) saveValue(v);
  }

  function deleteOperation() {
    modifySceneProp("timerStateOperations", getCurrent().toSpliced(index, 1));
  }

  return (
    <div className="bg-base-300 mt-xs px-[1rem] py-[0.5rem]">
      <div>
        <span className="text--1">{stateVariable.name}</span>
        <span className="text-xs ml-2xs text-primary">{`${stateVariable.type} operation`}</span>
        <button
          className="btn btn-xs btn-phantom float-right"
          onClick={deleteOperation}
        >
          Delete
        </button>
      </div>
      <fieldset className="fieldset mt-[0.5rem]">
        <OperationField
          type={stateVariable.type}
          operation={localOperation}
          value={localValue}
          onOperationChange={saveOperation}
          onValueChange={handleValueChange}
          onValueBlur={() => saveValue(localValue)}
        />
      </fieldset>
    </div>
  );
}

export default function TimerStateOperationMenu() {
  const timerStateOperations = useVisualScene((s) => s.timerStateOperations);
  const [createOpen, setCreateOpen] = useState(false);
  const ops = timerStateOperations ?? [];

  return (
    <>
      <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
        <input type="checkbox" />
        <div className="collapse-title flex items-center justify-between">
          On Timeout
          <PlusIcon
            size={18}
            onClick={() => setCreateOpen(true)}
            className="z-1"
          />
        </div>
        <div className="collapse-content text--1 bg-base-200 px-0">
          {ops.map((op, i) => (
            <TimerOperationRow key={i} operation={op} index={i} />
          ))}
        </div>
      </div>

      <CreateTimerOperationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
}
