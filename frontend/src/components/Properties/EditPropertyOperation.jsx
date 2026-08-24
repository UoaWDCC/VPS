import { useContext, useEffect, useState } from "react";
import ScenarioContext from "../../context/ScenarioContext";
import { modifyComponentProp } from "../../features/authoring/scene/operations/component";
import SelectInput from "../../features/authoring/components/Select";
import { propertyTypes, validOperations } from "./propertyTypes";

/**
 * Component used for editing property operations
 * Property operations are used to manipulate properties while playing through a scenario
 *
 * @component
 */
const EditPropertyOperation = ({
  component,
  operationIndex,
  propertyOperation,
}) => {
  const { properties } = useContext(ScenarioContext);

  if (!properties) {
    return null;
  }

  const [operation, setOperation] = useState(propertyOperation.operation);
  const [value, setValue] = useState(propertyOperation.value);

  useEffect(() => {
    if (propertyOperation.operation !== operation)
      setOperation(propertyOperation.operation);
    if (propertyOperation.value !== value) setValue(propertyOperation.value);
  }, [propertyOperation]);

  const property = properties.find(
    (p) => p.id === propertyOperation.stateVariableId
  );
  if (!property) return null;

  const deletePropertyOperation = () => {
    const filtered = component.stateOperations.toSpliced(operationIndex, 1);
    modifyComponentProp([component.id], "stateOperations", filtered);
  };

  function saveOperation(v) {
    setOperation(v);
    modifyComponentProp(
      [component.id],
      `stateOperations.${operationIndex}.operation`,
      v
    );
  }

  function saveValue(v) {
    setValue(v);
    modifyComponentProp(
      [component.id],
      `stateOperations.${operationIndex}.value`,
      v
    );
  }

  return (
    <div className="bg-base-300 mt-xs px-[1rem] py-[0.5rem]">
      <div>
        <span className="text--1">{property.name}</span>
        <span className="text-xs ml-2xs text-primary">{`${property.type} operation`}</span>
        <button
          className="btn btn-xs btn-phantom float-right"
          onClick={deletePropertyOperation}
        >
          Delete
        </button>
      </div>
      <fieldset className="fieldset mt-[0.5rem]">
        <div className="join">
          <SelectInput
            values={validOperations[property.type]}
            value={operation}
            onChange={saveOperation}
          />
          {property.type === propertyTypes.BOOLEAN ? (
            <SelectInput
              values={[true, false]}
              value={value}
              onChange={saveValue}
            />
          ) : (
            <input
              type={property.type === propertyTypes.STRING ? "text" : "number"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Value"
              className="input join-item"
              onBlur={() => saveValue(value)}
            />
          )}
        </div>
      </fieldset>
    </div>
  );
};

export default EditPropertyOperation;
