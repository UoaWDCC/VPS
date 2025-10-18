import { api } from "../../util/api";
import { useContext, useState } from "react";
import AuthenticationContext from "../../context/AuthenticationContext";
import toast from "react-hot-toast";
import ScenarioContext from "../../context/ScenarioContext";
import SceneContext from "../../context/SceneContext";
import SelectInput from "../../features/authoring/components/Select";
import { stateTypes } from "./stateTypes";

const EditStateVariable = ({ stateVariable, scenarioId }) => {
  const { user } = useContext(AuthenticationContext);
  const { setStateVariables } = useContext(ScenarioContext);
  const sceneContext = useContext(SceneContext);
  const { scenes, setScenes } = sceneContext || {
    scenes: [],
    setScenes: () => {},
  };

  const { name, type, value } = stateVariable;

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

  function editStateVariable(e) {
    e.preventDefault();
    const newStateVariable = {
      id: stateVariable.id, // Preserve the UUID
      name: newName,
      type: newType,
      value: newValue,
    };
    api
      .put(user, `api/scenario/${scenarioId}/stateVariables`, {
        originalName: name,
        newStateVariable,
      })
      .then((res) => {
        setStateVariables(res.data);
        toast.success("State variable edited!");
      })
      .catch((error) => {
        console.error("Error editing state variable:", error);
        toast.error("Failed to edit state variable.");
      });
  }

  async function deleteStateVariable(e) {
    e.preventDefault();

    // NOTE: name is legacy support, probably safe to remove
    const identifier = stateVariable.id || name;

    try {
      // Delete the state variable from the backend
      const res = await api.delete(
        user,
        `api/scenario/${scenarioId}/stateVariables/${identifier}`
      );
      setStateVariables(res.data);

      // Clean up all state operations that reference this deleted state variable
      // Only do this if we have access to scenes (SceneContext is available)
      if (scenes && scenes.length > 0 && setScenes) {
        const updatedScenes = scenes.map((scene) => ({
          ...scene,
          components: scene.components.map((component) => {
            if (!component.stateOperations) return component;

            // Filter out state operations that reference the deleted state variable
            const filteredOperations = component.stateOperations.filter(
              (operation) => {
                // Check both UUID and name references
                const referencesDeletedVariable =
                  (operation.stateVariableId &&
                    operation.stateVariableId === stateVariable.id) ||
                  (!operation.stateVariableId && operation.name === name);

                return !referencesDeletedVariable;
              }
            );

            return {
              ...component,
              stateOperations: filteredOperations,
            };
          }),
        }));

        // Update each scene in the backend
        const updatePromises = updatedScenes.map((scene) =>
          api.put(user, `api/scenario/${scenarioId}/scene/${scene._id}`, {
            name: scene.name,
            components: scene.components,
            time: scene.time,
          })
        );

        await Promise.all(updatePromises);

        // Update the local state
        setScenes(updatedScenes);

        toast.success(
          "State variable deleted and removed from all components!"
        );
      } else {
        toast.success("State variable deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting state variable:", error);
      toast.error("Failed to delete state variable.");
    }
  }

  function parseValue(e) {
    const val = e.target.value;
    if (type === stateTypes.NUMBER) setNewValue(Number(val));
    else setNewValue(val);
  }
  `bg-base-300 mt-xs px-[1rem] py-[0.5rem] `;

  return (
    <>
      <fieldset
        key={stateVariable.name}
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
            {type === stateTypes.BOOLEAN ? (
              <SelectInput
                value={newValue}
                values={["true", "false"]}
                onChange={setNewValue}
              />
            ) : (
              <input
                type={newType === stateTypes.NUMBER ? "number" : "text"}
                value={newValue ?? ""}
                onChange={parseValue}
                placeholder="Value"
                className="input"
              />
            )}
          </div>
        </div>
        <div className="ml-auto">
          <button
            className="btn btn-xs btn-phantom"
            onClick={deleteStateVariable}
          >
            Delete
          </button>
          <button className="btn btn-xs btn-phantom" onClick={resetFields}>
            Reset
          </button>
          <button
            className="btn btn-xs btn-phantom"
            onClick={editStateVariable}
          >
            Save
          </button>
        </div>
      </fieldset>
    </>
  );
};

export default EditStateVariable;
