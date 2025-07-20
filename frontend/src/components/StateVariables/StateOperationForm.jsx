import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@material-ui/core";
import { validOperations } from "./Operations";
import { StateTypes } from "./StateTypes";

const StateOperationForm = ({
  selectedState,
  operation,
  setOperation,
  value,
  setValue,
}) => {
  if (!selectedState) {
    return null;
  }

  return (
    <>
      <Typography variant="body2">
        Type:{" "}
        {selectedState.type.charAt(0).toUpperCase() +
          selectedState.type.slice(1)}
      </Typography>
      <FormControl>
        <InputLabel>Operation</InputLabel>
        <Select
          value={operation}
          onChange={(e) => {
            setOperation(e.target.value);
          }}
          required
        >
          {validOperations[selectedState.type].map((validOperation) => (
            <MenuItem key={validOperation} value={validOperation}>
              {validOperation.charAt(0).toUpperCase() + validOperation.slice(1)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        {selectedState.type === StateTypes.BOOLEAN ? (
          <>
            <InputLabel>Value</InputLabel>
            <Select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            >
              <MenuItem value={true}>True</MenuItem>
              <MenuItem value={false}>False</MenuItem>
            </Select>
          </>
        ) : (
          <TextField
            value={value}
            label={`Value`}
            onChange={(e) =>
              setValue(
                selectedState.type === StateTypes.NUMBER
                  ? Number(e.target.value)
                  : e.target.value
              )
            }
            required
            type={selectedState.type === StateTypes.NUMBER ? "number" : "text"}
          />
        )}
      </FormControl>
    </>
  );
};

export default StateOperationForm;
