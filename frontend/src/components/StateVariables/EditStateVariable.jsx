import { Box, Grid, Card } from "@material-ui/core";
import { api } from "../../util/api";
import { useContext, useState } from "react";
import AuthenticationContext from "../../context/AuthenticationContext";
import toast from "react-hot-toast";
import StateVariableForm from "./StateVariableForm";
import ScenarioContext from "../../context/ScenarioContext";
import SceneContext from "../../context/SceneContext";
import EditingTooltips from "./EditingTooltips";

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

  const editing = name !== newName || type !== newType || value != newValue;

  const resetFields = () => {
    setNewName(name);
    setNewType(type);
    setNewValue(value);
  };

  const editStateVariable = () => {
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
  };

  const deleteStateVariable = async () => {
    // Use ID if available (new format), otherwise fall back to name (legacy format)
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
  };

  return (
    <Card
      variant="outlined"
      style={{
        padding: "12px 25px",
        marginBottom: 12,
        ...(editing && { borderColor: "#ffa600" }),
      }}
    >
      <Grid container alignItems="center" spacing={2}>
        <StateVariableForm
          name={newName}
          type={newType}
          value={newValue}
          setName={setNewName}
          setType={setNewType}
          setValue={setNewValue}
        />
        <Box ml="auto" display="flex" alignItems="center">
          <EditingTooltips
            onReset={resetFields}
            onSave={editStateVariable}
            onDelete={deleteStateVariable}
          />
        </Box>
      </Grid>
    </Card>
  );
};

export default EditStateVariable;
