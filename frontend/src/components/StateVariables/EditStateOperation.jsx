import { Box, FormGroup, Typography } from "@material-ui/core";
import { useContext, useEffect, useState } from "react";
import EditingTooltips from "./EditingTooltips";
import StateOperationForm from "./StateOperationForm";
import ScenarioContext from "../../context/ScenarioContext";
import SceneContext from "../../context/SceneContext";
import { modifyComponentProp } from "../../features/authoring/scene/operations/component";
import SelectInput from "../../features/authoring/components/Select";
import { stateTypes, validOperations } from "./stateTypes";

/**
 * Component used for editing state operations
 * State operations are used to manipulate state variables while playing through a scenario
 *
 * @component
 */
const EditStateOperation = ({ component, operationIndex, stateOperation }) => {
  const { stateVariables } = useContext(ScenarioContext);

  const [operation, setOperation] = useState(stateOperation.operation)
  const [value, setValue] = useState(stateOperation.value);

  useEffect(() => {
    if (stateOperation.operation !== operation) setOperation(stateOperation.operation);
    if (stateOperation.value !== value) setValue(stateOperation.value);
  }, [stateOperation]);


  const stateVariable = stateVariables.find(v => v.id === stateOperation.stateVariableId);
  if (!stateVariable) return null;

  const deleteStateOperation = () => {
    const filtered = component.stateOperations.toSpliced(operationIndex, 1);
    modifyComponentProp(
      component.id,
      "stateOperations",
      filtered
    );
  };

  function editStateOperation() {
    modifyComponentProp(
      component.id,
      `stateOperations.${operationIndex}`,
      (prev) => ({ ...prev, operation, value })
    );
  };

  return (
    <div className="bg-base-300 mt-xs px-[1rem] py-[0.5rem]">
      <div>
        <span className="text--1">{stateVariable.name}</span>
        <span className="text-xs ml-2xs text-primary">{`${stateVariable.type} operation`}</span>
        <button className="btn btn-xs btn-phantom float-right" onClick={deleteStateOperation}>Delete</button>
      </div>
      <fieldset className="fieldset mt-[0.5rem]">
        <div className="join">
          <SelectInput values={validOperations[stateVariable.type]} value={operation} />
          {stateVariable.type === stateTypes.BOOLEAN ?
            <SelectInput values={[true, false]} value={value} onChange={setValue} onBlur={editStateOperation} /> :
            <input
              type={stateVariable.type === stateTypes.STRING ? "text" : "number"}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Value"
              className="input join-item"
              onBlur={editStateOperation}
            />
          }
        </div>
      </fieldset>
    </div>
  );
};

export default EditStateOperation;
