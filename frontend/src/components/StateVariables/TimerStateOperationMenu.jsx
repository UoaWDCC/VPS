import { useContext, useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";
import ScenarioContext from "context/ScenarioContext";
import { getDefaultValue, stateTypes, validOperations } from "./stateTypes";
import { modifySceneProp } from "../../features/authoring/scene/operations/modifiers";
import SelectInput from "../../features/authoring/components/Select";
import ModalDialog from "../ModalDialogue";
import useVisualScene from "../../features/authoring/stores/visual";

function TimerOperationRow({ operation, index, operations }) {
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

  function saveOperation(v) {
    setLocalOperation(v);
    const updated = operations.map((op, i) =>
      i === index ? { ...op, operation: v } : op
    );
    modifySceneProp("timerStateOperations", updated);
  }

  function saveValue(v) {
    setLocalValue(v);
    const updated = operations.map((op, i) =>
      i === index ? { ...op, value: v } : op
    );
    modifySceneProp("timerStateOperations", updated);
  }

  function deleteOperation() {
    modifySceneProp(
      "timerStateOperations",
      operations.toSpliced(index, 1)
    );
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
        <div className="join">
          <SelectInput
            values={validOperations[stateVariable.type]}
            value={localOperation}
            onChange={saveOperation}
          />
          {stateVariable.type === stateTypes.BOOLEAN ? (
            <SelectInput
              values={[true, false]}
              value={localValue}
              onChange={saveValue}
            />
          ) : (
            <input
              type={stateVariable.type === stateTypes.STRING ? "text" : "number"}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={() => saveValue(localValue)}
              placeholder="Value"
              className="input join-item"
            />
          )}
        </div>
      </fieldset>
    </div>
  );
}

export default function TimerStateOperationMenu() {
  const { stateVariables } = useContext(ScenarioContext);
  const timerStateOperations = useVisualScene((s) => s.timerStateOperations);
  const [createOpen, setCreateOpen] = useState(false);

  const [selectedState, setSelectedState] = useState(null);
  const [operation, setOperation] = useState(null);
  const [value, setValue] = useState(null);

  function openCreate() {
    setSelectedState(null);
    setOperation(null);
    setValue(null);
    setCreateOpen(true);
  }

  function onVariableChange(variable) {
    setSelectedState(variable);
    setOperation(null);
    setValue(getDefaultValue(variable.type));
  }

  function handleCreate() {
    if (!selectedState?.id || !operation) return;

    const newOperation = {
      stateVariableId: selectedState.id,
      displayName: selectedState.name,
      operation,
      value: selectedState.type === stateTypes.NUMBER ? Number(value) : value,
    };

    modifySceneProp("timerStateOperations", [
      ...(timerStateOperations ?? []),
      newOperation,
    ]);

    setCreateOpen(false);
  }

  const isSubmittable = selectedState && operation && value != null;
  const ops = timerStateOperations ?? [];

  return (
    <>
      <div className="collapse overflow-visible collapse-arrow bg-base-300 rounded-sm text-s">
        <input type="checkbox" />
        <div className="collapse-title flex items-center justify-between">
          On Timeout
          <PlusIcon size={18} onClick={openCreate} className="z-1" />
        </div>
        <div className="collapse-content text--1 bg-base-200 px-0">
          {ops.map((op, i) => (
            <TimerOperationRow
              key={i}
              operation={op}
              index={i}
              operations={ops}
            />
          ))}
        </div>
      </div>

      <ModalDialog
        title="Add Timeout State Operation"
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      >
        {!stateVariables?.length ? (
          <div className="text-s">
            No state variables found for this scenario. You can create some in
            the &apos;State Variables&apos; menu in the toolbar above.
          </div>
        ) : (
          <fieldset className="fieldset">
            <label className="label">State Variable</label>
            <SelectInput
              values={stateVariables}
              value={selectedState}
              display={(s) => s.name}
              onChange={onVariableChange}
            />
            {selectedState && (
              <>
                <label className="label">Operation</label>
                <div className="join">
                  <SelectInput
                    values={validOperations[selectedState.type]}
                    value={operation}
                    onChange={setOperation}
                  />
                  {selectedState.type === stateTypes.BOOLEAN ? (
                    <SelectInput
                      values={[true, false]}
                      value={value}
                      onChange={setValue}
                    />
                  ) : (
                    <input
                      type={
                        selectedState.type === stateTypes.STRING
                          ? "text"
                          : "number"
                      }
                      value={value ?? ""}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="Value"
                      className="input join-item"
                    />
                  )}
                </div>
              </>
            )}
          </fieldset>
        )}
        <div className="modal-action flex gap-2">
          <button
            className={`btn ${!isSubmittable ? "btn-disabled" : ""}`}
            onClick={handleCreate}
          >
            Add
          </button>
        </div>
      </ModalDialog>
    </>
  );
}
