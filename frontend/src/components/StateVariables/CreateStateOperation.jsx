import {
  Button,
  FormControl,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@material-ui/core";
import { useContext, useState } from "react";
import ScenarioContext from "context/ScenarioContext";
import SceneContext from "context/SceneContext";
import StateOperationForm from "./StateOperationForm";
import { getDefaultValue, stateTypes, validOperations } from "./stateTypes";
import { modifyComponentProp } from "../../features/authoring/scene/operations/component";
import SelectInput from "../../features/authoring/components/Select";

/**
 * Component used for creating state operations
 * State operations are used to manipulate state variables while playing through a scenario
 *
 * @component
 */
const CreateStateOperation = ({ component }) => {
  const { stateVariables } = useContext(ScenarioContext);

  const [selectedState, setSelectedState] = useState(null);
  const [operation, setOperation] = useState(null);
  const [value, setValue] = useState(null);

  if (!stateVariables?.length) {
    return (
      <div className="modal-box">
        <h3 className="font-bold text-m">Create State Operation</h3>
        <div className="text-xs">
          No state variables found, create some in the state variable menu
        </div>
        <div className="modal-action">
          <form method="dialog">
            <button className="btn">Close</button>
          </form>
        </div>
      </div>
    );
  }

  const handleSubmit = () => {
    // Validate that all required fields are filled
    if (!selectedState?.id || !operation) return;

    const newOperation = {
      stateVariableId: selectedState.id,
      displayName: selectedState.name,
      operation,
      value,
    };

    modifyComponentProp(
      component.id,
      "stateOperations",
      (prev) => [...(prev ?? []), newOperation]
    );

    setSelectedState(null);
    setOperation(null);
    setValue(null);
  };


  function onVariableChange(variable) {
    setSelectedState(variable);
    setValue(getDefaultValue(variable.type));
  }

  const isSubmittable = selectedState && operation && value != null;

  return (
    <div className="modal-box" tabIndex={0}>
      <h3 className="font-bold text-m">Create State Operation</h3>
      <fieldset className="fieldset mt-[0.5rem]">
        <label className="label">State Variable</label>
        <SelectInput values={stateVariables} value={selectedState} display={(s) => s.name} onChange={onVariableChange} />
        {selectedState ?
          <>
            <label className="label">Operation</label>
            <div className="join">
              <SelectInput values={validOperations[selectedState.type]} value={operation} onChange={setOperation} />
              {selectedState.type === stateTypes.BOOLEAN ?
                <SelectInput values={[true, false]} value={value} onChange={setValue} /> :
                <input
                  type={selectedState.type === stateTypes.STRING ? "text" : "number"}
                  value={value ?? ""}
                  onChange={e => setValue(e.target.value)}
                  placeholder="Value"
                  className="input join-item"
                />
              }
            </div>
          </>
          : null}
      </fieldset>
      <div className="modal-action">
        <form method="dialog" className="gap-2 flex">
          {/* if there is a button in form, it will close the modal */}
          <button className="btn">Cancel</button>
          <button className={`btn ${!isSubmittable && "btn-disabled"}`} onClick={handleSubmit}>Create</button>
        </form>
      </div>
    </div>
  );
};

export default CreateStateOperation;
