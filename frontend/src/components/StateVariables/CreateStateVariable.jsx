import { useState, useEffect, useContext } from "react";
import { stateTypes, getDefaultValue } from "./stateTypes";
import { api } from "../../util/api";
import AuthenticationContext from "../../context/AuthenticationContext";
import toast from "react-hot-toast";
import ScenarioContext from "../../context/ScenarioContext";
import SelectInput from "../../features/authoring/components/Select";

const DEFAULT_STATE_TYPE = stateTypes.STRING;

/**
 * Component used for creating state variables
 *
 * @component
 * @example
 * return (
 *  <CreateStateVariable />
 * )
 */
const CreateStateVariable = ({ scenarioId }) => {
  const { user } = useContext(AuthenticationContext);
  const { setStateVariables } = useContext(ScenarioContext);

  // Info for the new state variable
  const [name, setName] = useState(null);
  const [type, setType] = useState(DEFAULT_STATE_TYPE);
  const [value, setValue] = useState(getDefaultValue(DEFAULT_STATE_TYPE));

  // Reset to default value upon type change
  useEffect(() => {
    setValue(getDefaultValue(type));
  }, [type]);

  function handleSubmit(e) {
    e.preventDefault();

    const newStateVariable = { name, type, value };
    api
      .post(user, `/api/scenario/${scenarioId}/stateVariables`, {
        newStateVariable,
      })
      .then((response) => {
        setStateVariables(response.data);
        toast.success("State variable created successfully");
        // Reset name and value fields (but not type)
        setName("");
        setValue(getDefaultValue(type));
      })
      .catch((error) => {
        console.error("Error creating state variable:", error);
        toast.error("Error creating state variable");
      });
  }

  function parseValue(e) {
    const val = e.target.value;
    if (type === stateTypes.NUMBER) setValue(Number(val));
    else setValue(val);
  }

  const isSubmittable = name && type;

  return (
    <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
      <legend className="fieldset-legend">New Variable</legend>
      <div className="flex wrap gap-xs">
        <div className="flex flex-col flex-1">
          <label className="label mb-1">Name</label>
          <input
            type="text"
            value={name ?? ""}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="input"
          />
        </div>
        <div className="flex flex-col flex-1">
          <label className="label mb-1">Type</label>
          <SelectInput
            value={type}
            values={["string", "number", "boolean"]}
            onChange={setType}
          />
        </div>
        <div className="flex flex-col flex-1">
          <label className="label mb-1">Initial Value</label>
          {type === stateTypes.BOOLEAN ? (
            <SelectInput
              value={value}
              values={["true", "false"]}
              onChange={setValue}
            />
          ) : (
            <input
              type={type === stateTypes.NUMBER ? "number" : "text"}
              value={value ?? ""}
              onChange={parseValue}
              placeholder="Value"
              className="input"
            />
          )}
        </div>
      </div>
      <button
        className={`ml-auto btn btn-xs btn-phantom float-right ${!isSubmittable && "btn-disabled"}`}
        onClick={handleSubmit}
      >
        Create
      </button>
    </fieldset>
  );
};

export default CreateStateVariable;
