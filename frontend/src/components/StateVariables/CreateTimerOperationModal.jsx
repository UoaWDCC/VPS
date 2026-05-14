import { useContext, useEffect, useState } from "react";
import ScenarioContext from "context/ScenarioContext";
import { getDefaultValue, stateTypes, validOperations } from "./stateTypes";
import { modifySceneProp } from "../../features/authoring/scene/operations/modifiers";
import SelectInput from "../../features/authoring/components/Select";
import ModalDialog from "../ModalDialogue";
import useVisualScene from "../../features/authoring/stores/visual";

export function OperationField({
  type,
  operation,
  value,
  onOperationChange,
  onValueChange,
  onValueBlur,
}) {
  return (
    <div className="join">
      <SelectInput
        values={validOperations[type]}
        value={operation}
        onChange={onOperationChange}
      />
      {type === stateTypes.BOOLEAN ? (
        <SelectInput
          values={[true, false]}
          value={value}
          onChange={onValueChange}
        />
      ) : (
        <input
          type={type === stateTypes.STRING ? "text" : "number"}
          value={value ?? ""}
          onChange={(e) => onValueChange(e.target.value)}
          onBlur={onValueBlur}
          placeholder="Value"
          className="input join-item"
        />
      )}
    </div>
  );
}

export default function CreateTimerOperationModal({ open, onClose }) {
  const { stateVariables } = useContext(ScenarioContext);
  const timerStateOperations = useVisualScene((s) => s.timerStateOperations);

  const [selectedState, setSelectedState] = useState(null);
  const [operation, setOperation] = useState(null);
  const [value, setValue] = useState(null);

  useEffect(() => {
    if (open) {
      setSelectedState(null);
      setOperation(null);
      setValue(null);
    }
  }, [open]);

  function onVariableChange(variable) {
    setSelectedState(variable);
    setOperation(null);
    setValue(getDefaultValue(variable.type));
  }

  function handleCreate() {
    if (!selectedState?.id || !operation) return;

    modifySceneProp("timerStateOperations", [
      ...(timerStateOperations ?? []),
      {
        stateVariableId: selectedState.id,
        displayName: selectedState.name,
        operation,
        value: selectedState.type === stateTypes.NUMBER ? Number(value) : value,
      },
    ]);

    onClose();
  }

  const isSubmittable = selectedState && operation && value != null;

  return (
    <ModalDialog
      title="Add Timeout State Operation"
      open={open}
      onClose={onClose}
    >
      {!stateVariables?.length ? (
        <div className="text-s">
          No state variables found for this scenario. You can create some in the
          &apos;State Variables&apos; menu in the toolbar above.
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
              <OperationField
                type={selectedState.type}
                operation={operation}
                value={value}
                onOperationChange={setOperation}
                onValueChange={setValue}
              />
            </>
          )}
        </fieldset>
      )}
      <div className="modal-action flex gap-2">
        <button
          className={`btn ${!isSubmittable && "btn-disabled"}`}
          onClick={handleCreate}
        >
          Add
        </button>
      </div>
    </ModalDialog>
  );
}
