import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@material-ui/core";
import { stateTypes, validOperations } from "./stateTypes";

/**
 * Component with fields shared in both creating and editing state operations
 *
 * @component
 */
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
        {selectedState.type === stateTypes.BOOLEAN ? (
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
                selectedState.type === stateTypes.NUMBER
                  ? Number(e.target.value)
                  : e.target.value
              )
            }
            onKeyDown={(e) => {
              // stops browser shortcuts from messing with typing
              e.stopPropagation();
            }}
            required
            type={selectedState.type === stateTypes.NUMBER ? "number" : "text"}
          />
        )}
      </FormControl>
    </>
  );
};

export default StateOperationForm;
