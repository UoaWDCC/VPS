import { useContext, useState } from "react";
import ScenarioContext from "context/ScenarioContext";
import {
  getDefaultValue,
  propertyTypes,
  validOperations,
} from "./propertyTypes";
import { modifyComponentProp } from "../../features/authoring/scene/operations/component";
import SelectInput from "../../features/authoring/components/Select";
import ModalDialog from "../ModalDialogue";

/**
 * Component used for creating property operations
 * Property operations are used to manipulate properties while playing through a scenario
 *
 * @component
 */
const CreatePropertyOperation = ({ component, open, setOpen }) => {
  const { properties } = useContext(ScenarioContext);

  const [selectedProperty, setSelectedProperty] = useState(null);
  const [operation, setOperation] = useState(null);
  const [value, setValue] = useState(null);

  if (!properties?.length) {
    return (
      <ModalDialog
        title="Create Property Operation"
        open={open}
        onClose={() => setOpen(false)}
      >
        <div className="text-s">
          No properties found for this scenario. You can create some in the
          &apos;Properties&apos; menu in the toolbar above.
        </div>
      </ModalDialog>
    );
  }

  const handleSubmit = () => {
    if (!selectedProperty?.id || !operation) return;

    const newOperation = {
      stateVariableId: selectedProperty.id,
      displayName: selectedProperty.name,
      operation,
      value:
        selectedProperty.type === propertyTypes.NUMBER ? Number(value) : value,
    };

    modifyComponentProp(component.id, "stateOperations", (prev) => [
      ...(prev ?? []),
      newOperation,
    ]);

    setSelectedProperty(null);
    setOperation(null);
    setValue(null);
  };

  function onPropertyChange(property) {
    setSelectedProperty(property);
    setValue(getDefaultValue(property.type));
  }

  const isSubmittable = selectedProperty && operation && value != null;

  return (
    <ModalDialog
      title="Create Property Operation"
      open={open}
      onClose={() => setOpen(false)}
    >
      <fieldset className="fieldset">
        <label className="label">Property</label>
        <SelectInput
          values={properties}
          value={selectedProperty}
          display={(p) => p.name}
          onChange={onPropertyChange}
        />
        {selectedProperty ? (
          <>
            <label className="label">Operation</label>
            <div className="join">
              <SelectInput
                values={validOperations[selectedProperty.type]}
                value={operation}
                onChange={setOperation}
              />
              {selectedProperty.type === propertyTypes.BOOLEAN ? (
                <SelectInput
                  values={[true, false]}
                  value={value}
                  onChange={setValue}
                />
              ) : (
                <input
                  type={
                    selectedProperty.type === propertyTypes.STRING
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
        ) : null}
      </fieldset>
      <div className="modal-action flex gap-2">
        <button
          className={`btn ${!isSubmittable && "btn-disabled"}`}
          onClick={handleSubmit}
        >
          Create
        </button>
      </div>
    </ModalDialog>
  );
};

export default CreatePropertyOperation;
