import { useContext } from "react";
import { Grid, Typography, Button } from "@material-ui/core";
import { useGet } from "hooks/crudHooks";
import { useHistory } from "react-router-dom";
import AuthenticationContext from "context/AuthenticationContext";

export default function DesyncPage({ group }) {
  const { getUserIdToken: token } = useContext(AuthenticationContext);
  const history = useHistory();

  const handleGroupSceneIdRes = (res) => {
    history.replace(`/play/${group.scenarioId}/multiplayer/${res._id}`);
  };

  const onBack = () => {
    if (group) {
      useGet(`/api/group/${group._id}/desync`, handleGroupSceneIdRes, token);
    } else {
      history.goBack();
    }
  };

  return (
    <Grid
      container
      spacing={5}
      direction="column"
      alignItems="center"
      justifyContent="center"
      style={{ minHeight: "100vh" }}
    >
      <Grid item container direction="column" alignItems="center" spacing={4}>
        <Grid item>
          <Typography variant="h4">Desynchronised with server!</Typography>
        </Grid>
        <Grid>
          <Typography>
            This can happen when someone else made a move while you were
            playing.
          </Typography>
        </Grid>
        <Grid>
          <Typography>Your last action was not saved.</Typography>
        </Grid>
      </Grid>
      <Grid item>
        <Button color="primary" variant="contained" onClick={onBack}>
          Back to Scenario
        </Button>
      </Grid>
    </Grid>
  );
}
