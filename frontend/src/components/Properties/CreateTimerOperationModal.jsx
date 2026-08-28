import { useContext, useEffect, useState } from "react";
import ScenarioContext from "context/ScenarioContext";
import {
  getDefaultValue,
  propertyTypes,
  validOperations,
} from "./propertyTypes";
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
      {type === propertyTypes.BOOLEAN ? (
        <SelectInput
          values={[true, false]}
          value={value}
          onChange={onValueChange}
        />
      ) : (
        <input
          type={type === propertyTypes.STRING ? "text" : "number"}
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
  const { properties } = useContext(ScenarioContext);
  const timerStateOperations = useVisualScene((s) => s.timerStateOperations);

  const [selectedProperty, setSelectedProperty] = useState(null);
  const [operation, setOperation] = useState(null);
  const [value, setValue] = useState(null);

  useEffect(() => {
    if (open) {
      setSelectedProperty(null);
      setOperation(null);
      setValue(null);
    }
  }, [open]);

  function onPropertyChange(property) {
    setSelectedProperty(property);
    setOperation(null);
    setValue(getDefaultValue(property.type));
  }

  function handleCreate() {
    if (!selectedProperty?.id || !operation) return;

    modifySceneProp("timerStateOperations", [
      ...(timerStateOperations ?? []),
      {
        stateVariableId: selectedProperty.id,
        displayName: selectedProperty.name,
        operation,
        value:
          selectedProperty.type === propertyTypes.NUMBER
            ? Number(value)
            : value,
      },
    ]);

    onClose();
  }

  const isSubmittable = selectedProperty && operation && value != null;

  return (
    <ModalDialog
      title="Add Timeout Property Operation"
      open={open}
      onClose={onClose}
    >
      {!properties?.length ? (
        <div className="text-s">
          No properties found for this scenario. You can create some in the
          &apos;Properties&apos; menu in the toolbar above.
        </div>
      ) : (
        <fieldset className="fieldset">
          <label className="label">Property</label>
          <SelectInput
            values={properties}
            value={selectedProperty}
            display={(p) => p.name}
            onChange={onPropertyChange}
          />
          {selectedProperty && (
            <>
              <label className="label">Operation</label>
              <OperationField
                type={selectedProperty.type}
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
