import { useContext, useEffect, useState } from "react";
import ScenarioContext from "../../context/ScenarioContext";
import SelectInput from "../../features/authoring/components/Select";
import { stateTypes, validOperations } from "./stateTypes";
import AuthenticationContext from "../../context/AuthenticationContext";

/**
 * Component used for editing state operations
 * State operations are used to manipulate state variables while playing through a scenario
 *
 * @component
 */
const EditStateConditional = ({ fileId, conditional, conditionalIndex }) => {
  const { user } = useContext(AuthenticationContext);
  const { stateVariables } = useContext(ScenarioContext);

  if (!stateVariables) {
    return null;
  }

  const [comparator, setComparator] = useState(conditional.comparator);
  const [value, setValue] = useState(conditional.value);

  useEffect(() => {
    if (conditional.comparator !== comparator)
      setComparator(conditional.operation);
    if (conditional.value !== value) setValue(conditional.value);
  }, [conditional]);

  const stateVariable = stateVariables.find(
    (v) => v.id === conditional.stateVariableId
  );
  if (!stateVariable) return null;

  const deleteStateConditional = () => {};

  const editStateConditional = () => {};

  const resetFields = (e) => {
    e.preventDefault();
    setComparator(conditional.comparator);
    setValue(conditional.value);
  };

  return (
    <div className="bg-base-300 mt-xs px-[1rem] py-[0.5rem]">
      <div>
        <span className="text--1">{stateVariable.name}</span>
        <span className="text-xs ml-2xs text-primary">{`${stateVariable.type} operation`}</span>
      </div>
      <fieldset className="fieldset mt-[0.5rem]">
        <div className="join">
          <SelectInput
            values={validOperations[stateVariable.type]}
            value={comparator}
            onChange={setComparator}
          />
          {stateVariable.type === stateTypes.BOOLEAN ? (
            <SelectInput
              values={[true, false]}
              value={value}
              onChange={setValue}
            />
          ) : (
            <input
              type={
                stateVariable.type === stateTypes.STRING ? "text" : "number"
              }
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Value"
              className="input join-item"
              onBlur={() => saveValue(value)}
            />
          )}
        </div>
        <div className="ml-auto">
          <button
            className="btn btn-xs btn-phantom"
            onClick={deleteStateConditional}
          >
            Delete
          </button>
          <button className="btn btn-xs btn-phantom" onClick={resetFields}>
            Reset
          </button>
          <button
            className="btn btn-xs btn-phantom"
            onClick={editStateConditional}
          >
            Save
          </button>
        </div>
      </fieldset>
    </div>
  );
};

export default EditStateConditional;
