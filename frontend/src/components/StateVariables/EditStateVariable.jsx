import { Box, Grid, IconButton, Tooltip, Card } from "@material-ui/core";
import SaveIcon from "@material-ui/icons/Save";
import DeleteIcon from "@material-ui/icons/Delete";
import { api } from "../../util/api";
import { useContext, useState } from "react";
import AuthenticationContext from "../../context/AuthenticationContext";
import toast from "react-hot-toast";
import StateVariableForm from "./StateVariableForm";

const EditStateVariable = ({
  stateVariable,
  setStateVariables,
  scenarioId,
}) => {
  const { user } = useContext(AuthenticationContext);
  const { name, type, value } = stateVariable;

  const [newName, setNewName] = useState(name);
  const [newType, setNewType] = useState(type);
  const [newValue, setNewValue] = useState(value);

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
    <Card variant="outlined" style={{ padding: "12px 25px", marginBottom: 12 }}>
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
          <Tooltip title="Save">
            <IconButton color="primary" onClick={() => {}}>
              <SaveIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton color="secondary" onClick={deleteStateVariable}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Grid>
    </Card>
  );
};

export default EditStateVariable;
