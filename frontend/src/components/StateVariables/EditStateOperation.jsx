import { Box, FormGroup, Typography } from "@material-ui/core";
import { useContext, useState } from "react";
import EditingTooltips from "./EditingTooltips";
import StateOperationForm from "./StateOperationForm";
import ScenarioContext from "../../context/ScenarioContext";

const EditStateOperation = ({ stateOperation }) => {
  const { stateVariables } = useContext(ScenarioContext);

  const stateVariable = stateVariables.find(
    (variable) => variable.name === stateOperation.name
  );

  const [newOperation, setNewOperation] = useState(stateOperation.operation);
  const [newValue, setNewValue] = useState(stateOperation.value);

  return (
    <FormGroup
      style={{
        marginBottom: "60px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        background: "#f9f9f9",
        padding: "16px",
        borderRadius: "8px",
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
        <EditingTooltips />
      </Box>
    </FormGroup>
  );
};

export default EditStateOperation;
