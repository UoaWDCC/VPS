import {
  FormControl,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@material-ui/core";
import { stateTypes, getDefaultValue } from "./stateTypes";

const StateVariableForm = ({
  name,
  type,
  value,
  setName,
  setType,
  setValue,
}) => {
  return (
    <FormGroup
      style={{
        width: "85%",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <FormControl style={{ width: "250px" }} margin="normal">
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            // stops browser shortcuts from messing with typing
            e.stopPropagation();
          }}
          required
        />
      </FormControl>

      <FormControl style={{ width: "250px" }} margin="normal">
        <InputLabel>Type</InputLabel>
        <Select
          value={type}
          onChange={(e) => {
            const newType = e.target.value;
            setValue(getDefaultValue(newType));
            setType(newType);
          }}
          required
        >
          <MenuItem value={stateTypes.STRING}>String</MenuItem>
          <MenuItem value={stateTypes.NUMBER}>Number</MenuItem>
          <MenuItem value={stateTypes.BOOLEAN}>Boolean</MenuItem>
        </Select>
      </FormControl>

      <FormControl style={{ width: "250px" }} margin="normal">
        {type === stateTypes.BOOLEAN ? (
          <>
            <InputLabel>Initial Value</InputLabel>
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
            label={`Initial Value`}
            onChange={(e) =>
              setValue(
                type === stateTypes.NUMBER
                  ? Number(e.target.value)
                  : e.target.value
              )
            }
            onKeyDown={(e) => {
              //  stops browser shortcuts from messing with typing
              e.stopPropagation();
            }}
            required
            type={type === stateTypes.NUMBER ? "number" : "text"}
          />
        )}
      </FormControl>
    </FormGroup>
  );
};

export default StateVariableForm;
