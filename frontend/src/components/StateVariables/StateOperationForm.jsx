import {
  FormControl,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@material-ui/core";
import { useContext, useState } from "react";
import ScenarioContext from "context/ScenarioContext";
import { validOperations } from "./Operations";
import { StateTypes } from "./StateTypes";

const StateOperationForm = () => {
  const { stateVariables } = useContext(ScenarioContext);

  const [selectedState, setSelectedState] = useState("");
  const [newValue, setNewValue] = useState();

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
      {stateVariables && stateVariables.length > 0 ? (
        <>
          <FormControl>
            <InputLabel>Name</InputLabel>
            <Select>
              {stateVariables.map((stateVariable) => (
                <MenuItem
                  key={stateVariable.name}
                  value={stateVariable.name}
                  onClick={() => setSelectedState(stateVariable)}
                >
                  {stateVariable.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedState && (
            <>
              <Typography variant="body2">
                Type:{" "}
                {selectedState.type.charAt(0).toUpperCase() +
                  selectedState.type.slice(1)}
              </Typography>
              <FormControl>
                <InputLabel>Operation</InputLabel>
                <Select>
                  {validOperations[selectedState.type].map((operation) => (
                    <MenuItem key={operation} value={operation}>
                      {operation.charAt(0).toUpperCase() + operation.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                {selectedState.type === StateTypes.BOOLEAN ? (
                  <>
                    <InputLabel>Value</InputLabel>
                    <Select
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      required
                    >
                      <MenuItem value={true}>True</MenuItem>
                      <MenuItem value={false}>False</MenuItem>
                    </Select>
                  </>
                ) : (
                  <TextField
                    value={newValue}
                    label={`Value`}
                    onChange={(e) =>
                      setNewValue(
                        selectedState.type === StateTypes.NUMBER
                          ? Number(e.target.value)
                          : e.target.value
                      )
                    }
                    required
                    type={
                      selectedState.type === StateTypes.NUMBER
                        ? "number"
                        : "text"
                    }
                  />
                )}
              </FormControl>
            </>
          )}
        </>
      ) : (
        <Typography variant="body2">
          No state variables found, create some in the state variable menu.
        </Typography>
      )}
    </FormGroup>
  );
};

export default StateOperationForm;
