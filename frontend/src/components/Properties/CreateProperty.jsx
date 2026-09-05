import { useState, useEffect, useContext } from "react";
import { propertyTypes, getDefaultValue } from "./propertyTypes";
import { api } from "../../util/api";
import AuthenticationContext from "../../context/AuthenticationContext";
import toast from "react-hot-toast";
import ScenarioContext from "../../context/ScenarioContext";
import SelectInput from "../../features/authoring/components/Select";

const DEFAULT_PROPERTY_TYPE = propertyTypes.STRING;
const TYPE_LABELS = {
  string: "Text",
  number: "Number",
  boolean: "True/False",
};

/**
 * Component used for creating properties
 *
 * @component
 * @example
 * return (
 *  <CreateProperty />
 * )
 */
const CreateProperty = ({ scenarioId }) => {
  const { user } = useContext(AuthenticationContext);
  const { setProperties } = useContext(ScenarioContext);

  const [name, setName] = useState(null);
  const [type, setType] = useState(DEFAULT_PROPERTY_TYPE);
  const [value, setValue] = useState(getDefaultValue(DEFAULT_PROPERTY_TYPE));

  useEffect(() => {
    setValue(getDefaultValue(type));
  }, [type]);

  function handleSubmit(e) {
    e.preventDefault();

    const newProperty = { name, type, value };
    api
      .post(user, `/api/scenario/${scenarioId}/properties`, {
        newProperty,
      })
      .then((response) => {
        setProperties(response.data);
        toast.success("Property created successfully");
        setName("");
        setValue(getDefaultValue(type));
      })
      .catch((error) => {
        console.error("Error creating property:", error);
        toast.error("Error creating property");
      });
  }

  function parseValue(e) {
    const val = e.target.value;
    if (type === propertyTypes.NUMBER) setValue(val === "" ? "" : Number(val));
    else setValue(val);
  }

  const isSubmittable = name && type;

  return (
    <fieldset className="fieldset bg-base-200 border-base-300 rounded-box border p-4">
      <legend className="fieldset-legend">New Property</legend>
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
            display={(value) => TYPE_LABELS[value] ?? value}
            onChange={setType}
          />
        </div>
        <div className="flex flex-col flex-1">
          <label className="label mb-1">Initial Value</label>
          {type === propertyTypes.BOOLEAN ? (
            <SelectInput
              value={value}
              values={["true", "false"]}
              onChange={setValue}
            />
          ) : (
            <input
              type={type === propertyTypes.NUMBER ? "number" : "text"}
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

export default CreateProperty;
