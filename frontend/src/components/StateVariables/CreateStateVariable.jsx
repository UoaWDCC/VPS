import {
  Button,
  FormControl,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@material-ui/core";
import { useState, useEffect } from "react";
import StateTypes from "./StateTypes";

const DEFAULT_STATE_TYPE = StateTypes.STRING;

export const getDefaultValue = (type) => {
  switch (type) {
    case StateTypes.STRING:
      return "";
    case StateTypes.NUMBER:
      return 0;
    case StateTypes.BOOLEAN:
      return false;
    default:
      return "";
  }
};

/**
 * Component used for creating state variables
 *
 * @component
 * @example
 * return (
 *  <CreateStateVariable />
 * )
 */
const CreateStateVariable = () => {
  const [name, setName] = useState("");
  const [type, setType] = useState(DEFAULT_STATE_TYPE);
  const [value, setValue] = useState(getDefaultValue(DEFAULT_STATE_TYPE));

  // Update value upon type change
  useEffect(() => {
    setValue(getDefaultValue(type));
  }, [type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({
      name,
      type,
      value,
    });
    // TODO: Create the state variable
  };

  return (
    <form
      style={{
        backgroundColor: "#f9f9f9",
        padding: "20px",
        borderRadius: "8px",
        maxWidth: "100%",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <Typography variant="subtitle1">Create State Variable</Typography>
      <FormGroup
        style={{ flexDirection: "row", justifyContent: "space-between" }}
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
          <InputLabel id="variable-type-label">Type</InputLabel>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
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
              onChange={(e) => setValue(e.target.value)}
              required
              type={type === StateTypes.NUMBER ? "number" : "text"}
            />
          )}
        </FormControl>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          style={{ height: "40px" }}
          onClick={handleSubmit}
        >
          Create
        </Button>
      </FormGroup>
    </form>
  );
};

export default CreateStateVariable;
