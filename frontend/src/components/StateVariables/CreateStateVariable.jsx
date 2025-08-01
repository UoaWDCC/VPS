import { Button, Grid } from "@material-ui/core";
import { useState, useEffect, useContext } from "react";
import { StateTypes, getDefaultValue } from "./StateTypes";
import { api } from "../../util/api";
import AuthenticationContext from "../../context/AuthenticationContext";
import toast from "react-hot-toast";
import StateVariableForm from "./StateVariableForm";
import ScenarioContext from "../../context/ScenarioContext";

const DEFAULT_STATE_TYPE = StateTypes.STRING;

/**
 * Component used for creating state variables
 *
 * @component
 * @example
 * return (
 *  <CreateStateVariable />
 * )
 */
const CreateStateVariable = ({ scenarioId }) => {
  const { user } = useContext(AuthenticationContext);
  const { setStateVariables } = useContext(ScenarioContext);

  // Info for the new state variable
  const [name, setName] = useState("");
  const [type, setType] = useState(DEFAULT_STATE_TYPE);
  const [value, setValue] = useState(getDefaultValue(DEFAULT_STATE_TYPE));

  // Reset to default value upon type change
  useEffect(() => {
    setValue(getDefaultValue(type));
  }, [type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newStateVariable = {
      name,
      type,
      value,
    };
    api
      .post(user, `/api/scenario/${scenarioId}/stateVariables`, {
        newStateVariable,
      })
      .then((response) => {
        setStateVariables(response.data);
        toast.success("State variable created successfully");
        // Reset name and value fields (but not type)
        setName("");
        setValue(getDefaultValue(type));
      })
      .catch((error) => {
        console.error("Error creating state variable:", error);
        toast.error("Error creating state variable");
      });
  };

  return (
    <form>
      <Grid container alignItems="center" justifyContent="space-between">
        <Grid item xs>
          <StateVariableForm
            name={name}
            type={type}
            value={value}
            setName={setName}
            setType={setType}
            setValue={setValue}
          />
        </Grid>
        <Grid item>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            onClick={handleSubmit}
          >
            Create
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default CreateStateVariable;
