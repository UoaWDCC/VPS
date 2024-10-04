import { Grid, Typography, Button } from "@material-ui/core";
import { useHistory } from "react-router-dom";

export default function DesyncPage() {
  const history = useHistory();

  const onBack = () => {
    history.go(0);
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
        <button className="btn vps" onClick={onBack}>
          Back to Scenario
        </button>
      </Grid>
    </Grid>
  );
}
