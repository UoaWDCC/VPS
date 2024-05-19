import { useContext, useEffect } from "react";
import { Grid, Typography, Button } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import PlayScenarioContext from "../../context/PlayScenarioContext";

export default function DesyncPage() {
  const history = useHistory();
  const { scenarioId } = useContext(PlayScenarioContext);

  const onBack = () => {
    history.push(`/play/${scenarioId}`);
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
