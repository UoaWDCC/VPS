import { useContext, useEffect, useState } from "react";
import ScenarioContext from "../../context/ScenarioContext";
import SelectInput from "../../features/authoring/components/Select";
import { stateTypes, validComparators } from "./stateTypes";
import AuthenticationContext from "../../context/AuthenticationContext";
import { api } from "../../util/api";
import toast from "react-hot-toast";

/**
 * Component used for editing state operations
 * State operations are used to manipulate state variables while playing through a scenario
 *
 * @component
 */
const EditStateConditional = ({
  fileId,
  conditional,
  conditionalIndex,
  updateFile,
}) => {
  const { user } = useContext(AuthenticationContext);
  const { stateVariables } = useContext(ScenarioContext);

  if (!stateVariables) {
    return null;
  }

  const [comparator, setComparator] = useState(conditional.comparator);
  const [value, setValue] = useState(conditional.value);

  const isEditing =
    comparator !== conditional.comparator || value !== conditional.value;

  useEffect(() => {
    if (conditional.comparator !== comparator)
      setComparator(conditional.operation);
    if (conditional.value !== value) setValue(conditional.value);
  }, [conditional]);

  const stateVariable = stateVariables.find(
    (v) => v.id === conditional.stateVariableId
  );
  if (!stateVariable) return null;

  const deleteStateConditional = () => {
    api
      .delete(user, `/api/files/state-conditionals/${fileId}`, {
        stateConditionalIndex: conditionalIndex,
      })
      .then((res) => {
        updateFile(res.data);
        console.log(res);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Error deleting state conditional");
      });
  };

  const editStateConditional = () => {
    const stateConditional = {
      ...conditional,
      comparator,
      value,
    };

    api
      .put(user, `/api/files/state-conditionals/${fileId}`, {
        stateConditional,
        stateConditionalIndex: conditionalIndex,
      })
      .then((res) => {
        console.log(res);
        updateFile(res.data);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Error editing state conditional");
      });
  };

  const resetFields = (e) => {
    e.preventDefault();
    setComparator(conditional.comparator);
    setValue(conditional.value);
  };

  return (
    <div
      className={`bg-base-300 mt-xs px-[1rem] py-[0.5rem] ${
        isEditing ? "ring-2 ring-grey" : ""
      }`}
    >
      <div>
        <span className="text--1">{stateVariable.name}</span>
        <span className="text-xs ml-2xs text-primary">{`${stateVariable.type} operation`}</span>
      </div>
      <fieldset className="fieldset mt-[0.5rem]">
        <div className="join">
          <SelectInput
            values={validComparators[stateVariable.type]}
            value={comparator}
            onChange={setComparator}
          />
          {stateVariable.type === stateTypes.BOOLEAN ? (
            <SelectInput
              values={[true, false]}
              value={value}
              onChange={(e) => setValue(e.target.value)}
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
