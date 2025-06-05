import {
  FormControl,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@material-ui/core";
import { StateTypes, getDefaultValue } from "./StateTypes";

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
          <MenuItem value={StateTypes.STRING}>String</MenuItem>
          <MenuItem value={StateTypes.NUMBER}>Number</MenuItem>
          <MenuItem value={StateTypes.BOOLEAN}>Boolean</MenuItem>
        </Select>
      </FormControl>

      <FormControl style={{ width: "250px" }} margin="normal">
        {type === StateTypes.BOOLEAN ? (
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
                type === StateTypes.NUMBER
                  ? Number(e.target.value)
                  : e.target.value
              )
            }
            required
            type={type === StateTypes.NUMBER ? "number" : "text"}
          />
        )}
      </FormControl>
    </FormGroup>
  );
};

export default StateVariableForm;
