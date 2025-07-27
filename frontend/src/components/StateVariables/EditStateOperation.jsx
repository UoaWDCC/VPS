import { Box, FormGroup, Typography } from "@material-ui/core";
import { useContext, useState } from "react";
import EditingTooltips from "./EditingTooltips";
import StateOperationForm from "./StateOperationForm";
import ScenarioContext from "../../context/ScenarioContext";
import SceneContext from "../../context/SceneContext";

/**
 * Component used for editing state operations
 * State operations are used to manipulate state variables while playing through a scenario
 *
 * @component
 */
const EditStateOperation = ({
  componentIndex,
  component,
  operationIndex,
  stateOperation,
}) => {
  const { stateVariables } = useContext(ScenarioContext);
  const { updateComponentProperty } = useContext(SceneContext);

  // Define deleteStateOperation function early so it can be used in error handling
  const deleteStateOperation = () => {
    const newStateOperations = component.stateOperations.filter(
      (_, index) => index !== operationIndex
    );
    updateComponentProperty(
      componentIndex,
      "stateOperations",
      newStateOperations
    );
  };

  // Try to find by ID first (new format), then fallback to name (legacy format)
  const stateVariable = stateVariables.find(
    (variable) => 
      (stateOperation.stateVariableId && variable.id === stateOperation.stateVariableId) ||
      (!stateOperation.stateVariableId && variable.name === stateOperation.name)
  );

  // Handle case where state variable is not found
  if (!stateVariable) {
    return (
      <FormGroup
        style={{
          marginBottom: "30px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          background: "#ffebee",
          padding: "16px",
          borderRadius: "8px",
          border: "2px solid #f44336",
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" color="error">
          State Variable Not Found
        </Typography>
        <Typography variant="body2" color="error">
          The state variable "{stateOperation.displayName || stateOperation.name}" no longer exists.
        </Typography>
        <Box width="100%" display="flex" justifyContent="flex-end">
          <EditingTooltips
            onDelete={deleteStateOperation}
            showOnlyDelete={true}
          />
        </Box>
      </FormGroup>
    );
  }

  const [newOperation, setNewOperation] = useState(stateOperation.operation);
  const [newValue, setNewValue] = useState(stateOperation.value);

  const editing =
    newOperation !== stateOperation.operation ||
    newValue !== stateOperation.value;

  const resetStateOperation = () => {
    setNewOperation(stateOperation.operation);
    setNewValue(stateOperation.value);
  };

  const editStateOperation = () => {
    const newStateOperations = component.stateOperations.map(
      (operation, index) =>
        index === operationIndex
          ? { ...operation, operation: newOperation, value: newValue }
          : operation
    );
    updateComponentProperty(
      componentIndex,
      "stateOperations",
      newStateOperations
    );
  };

  return (
    <FormGroup
      style={{
        marginBottom: "30px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        background: "#f9f9f9",
        padding: "16px",
        borderRadius: "8px",
        border: "2px solid",
        borderColor: editing ? "#ffa600" : "transparent",
      }}
    >
        <Typography variant="subtitle1" fontWeight="bold">
          {stateVariable.name}
        </Typography>
      <StateOperationForm
        selectedState={stateVariable}
        operation={newOperation}
        setOperation={setNewOperation}
        value={newValue}
        setValue={setNewValue}
      />
      <Box width="100%" display="flex" justifyContent="space-between">
        <EditingTooltips
          onReset={resetStateOperation}
          onSave={editStateOperation}
          onDelete={deleteStateOperation}
        />
      </Box>
    </FormGroup>
  );
};

export default EditStateOperation;
