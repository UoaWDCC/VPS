import { Box, FormGroup, Typography } from "@material-ui/core";
import { useContext, useState } from "react";
import EditingTooltips from "./EditingTooltips";
import StateOperationForm from "./StateOperationForm";
import ScenarioContext from "../../context/ScenarioContext";
import SceneContext from "../../context/SceneContext";

const EditStateOperation = ({
  componentIndex,
  component,
  operationIndex,
  stateOperation,
}) => {
  const { stateVariables } = useContext(ScenarioContext);
  const { updateComponentProperty } = useContext(SceneContext);

  const stateVariable = stateVariables.find(
    (variable) => variable.name === stateOperation.name
  );

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
        {stateOperation.name}
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
