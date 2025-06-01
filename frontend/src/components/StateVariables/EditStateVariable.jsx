import { Box, Grid,  IconButton, Tooltip, Card } from "@material-ui/core";
import SaveIcon from "@material-ui/icons/Save";
import DeleteIcon from "@material-ui/icons/Delete";

const EditStateVariable = ({ stateVariable }) => {
  const { name, type, value } = stateVariable;

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
          <strong>Value:</strong> {typeof value === "boolean" ? value.toString() : value}
        </Grid>
        <Box ml="auto" display="flex" alignItems="center">
          <Tooltip title="Save">
            <IconButton color="primary" onClick={() => {}}>
              <SaveIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton color="secondary" onClick={() => {}}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Grid>
    </Card>
  );
};

export default EditStateVariable;
