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
import { getDefaultValue } from "./StateTypes";

/**
 * Component used for creating state operations
 * State operations are used to manipulate state variables while playing through a scenario
 *
 * @component
 */
const CreateStateOperation = ({ component, componentIndex }) => {
  const { stateVariables } = useContext(ScenarioContext);
  const { updateComponentProperty } = useContext(SceneContext);

  const [selectedState, setSelectedState] = useState("");
  const [operation, setOperation] = useState("");
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const newStateOperations = [
      ...(component.stateOperations || []),
      {
        name: selectedState.name,
        operation,
        value,
      },
    ];
    updateComponentProperty(
      componentIndex,
      "stateOperations",
      newStateOperations
    );

    setSelectedState();
    setOperation();
    setValue();
  };

  if (stateVariables && stateVariables.length == 0) {
    return (
      <Typography variant="body2">
        No state variables found, create some in the state variable menu
      </Typography>
    );
  }

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
      }}
    >
      <FormControl>
        <InputLabel>Name</InputLabel>
        <Select
          value={selectedState}
          onChange={(e) => {
            const newSelectedState = e.target.value;
            setSelectedState(newSelectedState);
            setOperation("");
            setValue(getDefaultValue(newSelectedState.type));
          }}
          required
        >
          {stateVariables.map((stateVariable) => (
            <MenuItem key={stateVariable.name} value={stateVariable}>
              {stateVariable.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <StateOperationForm
        selectedState={selectedState}
        operation={operation}
        setOperation={setOperation}
        value={value}
        setValue={setValue}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        onClick={handleSubmit}
      >
        Create
      </Button>
    </FormGroup>
  );
};

export default CreateStateOperation;
