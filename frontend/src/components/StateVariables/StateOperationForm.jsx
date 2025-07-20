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
        <Select>
          {validOperations[selectedState.type].map((operation) => (
            <MenuItem
              key={operation}
              value={operation}
              onClick={() => setOperation(operation)}
            >
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
