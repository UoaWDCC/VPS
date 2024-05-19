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
      spacing={6}
      direction="column"
      alignItems="center"
      justifyContent="center"
      style={{ minHeight: "100vh" }}
    >
      <Grid item>
        <Typography style={{ color: "#FF00FF" }}>
          Hosted at: {window.location.href}
        </Typography>
      </Grid>
      <Grid item container direction="column" alignItems="center" spacing={2}>
        <Grid item>
          <Typography variant="h4">Desynchronized with Server</Typography>
        </Grid>
        <Grid>
          <Typography>This can happen asdlfkaldkfj</Typography>
        </Grid>
      </Grid>
      <Grid item>
        <Button color="primary" variant="contained" onClick={onBack}>
          Back
        </Button>
      </Grid>
    </Grid>
  );
}
