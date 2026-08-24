import { api } from "../../util/api";
import { useContext, useState } from "react";
import AuthenticationContext from "../../context/AuthenticationContext";
import toast from "react-hot-toast";
import ScenarioContext from "../../context/ScenarioContext";
import SceneContext from "../../context/SceneContext";
import SelectInput from "../../features/authoring/components/Select";
import { isBooleanPropertyType, propertyTypes } from "./propertyTypes";
import { arrayToObject } from "../../features/authoring/scene/util";

const EditProperty = ({ property, scenarioId }) => {
  const { user } = useContext(AuthenticationContext);
  const { setProperties } = useContext(ScenarioContext);
  const sceneContext = useContext(SceneContext);
  const { scenes, modifyScene, reFetch } = sceneContext || {
    scenes: [],
    saveScenePatch: async () => {},
    reFetch: async () => {},
  };

  const { name, type, value } = property;

  const [newName, setNewName] = useState(name);
  const [newType, setNewType] = useState(type);
  const [newValue, setNewValue] = useState(value);

  const isEditing = newName !== name || newType !== type || newValue !== value;

  function resetFields(e) {
    e.preventDefault();
    setNewName(name);
    setNewType(type);
    setNewValue(value);
  }

  function editProperty(e) {
    e.preventDefault();
    const newProperty = {
      id: property.id,
      name: newName,
      type: newType,
      value: newValue,
    };
    api
      .put(user, `api/scenario/${scenarioId}/properties`, {
        originalName: name,
        newProperty,
      })
      .then((res) => {
        setProperties(res.data);
        toast.success("Property edited!");
      })
      .catch((error) => {
        console.error("Error editing property:", error);
        toast.error("Failed to edit property.");
      });
  }

  async function deleteProperty(e) {
    e.preventDefault();

    const identifier = property.id || name;

    try {
      const res = await api.delete(
        user,
        `api/scenario/${scenarioId}/properties/${identifier}`
      );
      setProperties(res.data);

      if (scenes && scenes.length > 0 && modifyScene) {
        const updatedScenes = scenes.map((scene) => ({
          ...scene,
          components: arrayToObject(
            scene.components.map((component) => {
              const filteredOperations = component.stateOperations?.filter(
                (operation) => {
                  const referencesDeletedProperty =
                    (operation.stateVariableId &&
                      operation.stateVariableId === property.id) ||
                    (!operation.stateVariableId && operation.name === name);

                  return !referencesDeletedProperty;
                }
              );
              const filteredBindings = component.stateBindings?.filter(
                (binding) => binding.stateVariableId !== property.id
              );

              if (!filteredOperations && !filteredBindings) return component;

              return {
                ...component,
                ...(filteredOperations && {
                  stateOperations: filteredOperations,
                }),
                ...(filteredBindings && {
                  stateBindings: filteredBindings,
                }),
              };
            })
          ),
        }));

        const updatePromises = updatedScenes.map(modifyScene);

        await Promise.all(updatePromises);
        await reFetch();

        toast.success("Property deleted and removed from all components!");
      } else {
        toast.success("Property deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting property:", error);
      toast.error("Failed to delete property.");
    }
  }

  function parseValue(e) {
    const val = e.target.value;
    if (newType === propertyTypes.NUMBER)
      setNewValue(val === "" ? "" : Number(val));
    else setNewValue(val);
  }

  return (
    <>
      <fieldset
        key={property.name}
        className={`fieldset bg-base-200 border-base-300 rounded-box border p-4 ${
          isEditing ? "ring-2 ring-grey" : ""
        }`}
      >
        <div className="flex wrap gap-xs">
          <div className="flex-1 flex flex-col">
            <label className="label mb-1">Name</label>
            <input
              type="text"
              value={newName ?? ""}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="input"
            />
          </div>
          <div className="flex-1 flex flex-col">
            <label className="label mb-1">Type</label>
            <SelectInput
              value={newType}
              values={["string", "number", "boolean"]}
              onChange={setNewType}
            />
          </div>
          <div className="flex-1 flex flex-col">
            <label className="label mb-1">Initial Value</label>
            {isBooleanPropertyType(newType) ? (
              <SelectInput
                value={newValue}
                values={["true", "false"]}
                onChange={setNewValue}
              />
            ) : (
              <input
                type={newType === propertyTypes.NUMBER ? "number" : "text"}
                value={newValue ?? ""}
                onChange={parseValue}
                placeholder="Value"
                className="input"
              />
            )}
          </div>
        </div>
        <div className="ml-auto">
          <button className="btn btn-xs btn-phantom" onClick={deleteProperty}>
            Delete
          </button>
          <button className="btn btn-xs btn-phantom" onClick={resetFields}>
            Reset
          </button>
          <button className="btn btn-xs btn-phantom" onClick={editProperty}>
            Save
          </button>
        </div>
      </fieldset>
    </>
  );
};

export default EditProperty;
