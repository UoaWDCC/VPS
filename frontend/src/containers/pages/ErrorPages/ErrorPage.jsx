import { Grid, Typography } from "@material-ui/core";

export default function ErrorPage() {
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
          <Typography variant="h4">{"Something went wrong :\\"}</Typography>
        </Grid>
        <Grid>
          <Typography>
            Some unexpected error occurred while trying to play the scenario.
            Please try again later.
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}
