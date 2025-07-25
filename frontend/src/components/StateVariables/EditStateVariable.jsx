import { Box, Grid, Card } from "@material-ui/core";
import { api } from "../../util/api";
import { useContext, useState } from "react";
import AuthenticationContext from "../../context/AuthenticationContext";
import toast from "react-hot-toast";
import StateVariableForm from "./StateVariableForm";
import ScenarioContext from "../../context/ScenarioContext";
import EditingTooltips from "./EditingTooltips";

const EditStateVariable = ({ stateVariable, scenarioId }) => {
  const { user } = useContext(AuthenticationContext);
  const { setStateVariables } = useContext(ScenarioContext);

  const { name, type, value } = stateVariable;

  const [newName, setNewName] = useState(name);
  const [newType, setNewType] = useState(type);
  const [newValue, setNewValue] = useState(value);

  const editing = name !== newName || type !== newType || value != newValue;

  const resetFields = () => {
    setNewName(name);
    setNewType(type);
    setNewValue(value);
  };

  const editStateVariable = () => {
    const newStateVariable = {
      name: newName,
      type: newType,
      value: newValue,
    };
    api
      .put(user, `api/scenario/${scenarioId}/stateVariables`, {
        originalName: name,
        newStateVariable,
      })
      .then((res) => {
        setStateVariables(res.data);
        toast.success("State variable edited!");
      })
      .catch((error) => {
        console.error("Error editing state variable:", error);
        toast.error("Failed to edit state variable.");
      });
  };

  const deleteStateVariable = () => {
    api
      .delete(user, `api/scenario/${scenarioId}/stateVariables/${name}`)
      .then((res) => {
        setStateVariables(res.data);
        toast.success("State variable deleted successfully!");
      })
      .catch((error) => {
        console.error("Error deleting state variable:", error);
        toast.error("Failed to delete state variable.");
      });
  };

  return (
    <Card
      variant="outlined"
      style={{
        padding: "12px 25px",
        marginBottom: 12,
        ...(editing && { borderColor: "#ffa600" }),
      }}
    >
      <Grid container alignItems="center" spacing={2}>
        <StateVariableForm
          name={newName}
          type={newType}
          value={newValue}
          setName={setNewName}
          setType={setNewType}
          setValue={setNewValue}
        />
        <Box ml="auto" display="flex" alignItems="center">
          <EditingTooltips
            onReset={resetFields}
            onSave={editStateVariable}
            onDelete={deleteStateVariable}
          />
        </Box>
      </Grid>
    </Card>
  );
};

export default EditStateVariable;
