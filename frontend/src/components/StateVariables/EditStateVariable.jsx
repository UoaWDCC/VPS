import { Box, Grid, IconButton, Tooltip, Card } from "@material-ui/core";
import SaveIcon from "@material-ui/icons/Save";
import DeleteIcon from "@material-ui/icons/Delete";
import { api } from "../../util/api";
import { useContext } from "react";
import AuthenticationContext from "../../context/AuthenticationContext";
import toast from "react-hot-toast";

const EditStateVariable = ({
  stateVariable,
  setStateVariables,
  scenarioId,
}) => {
  const { user } = useContext(AuthenticationContext);
  const { name, type, value } = stateVariable;

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
    <Card variant="outlined" style={{ padding: 16, marginBottom: 12 }}>
      <Grid container alignItems="center" spacing={2}>
        <Grid item>
          <strong>Name:</strong> {name}
        </Grid>
        <Grid item>
          <strong>Type:</strong> {type}
        </Grid>
        <Grid item>
          <strong>Value:</strong>{" "}
          {typeof value === "boolean" ? value.toString() : value}
        </Grid>
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
