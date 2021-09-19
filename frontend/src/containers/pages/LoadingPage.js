import React from "react";
import { CircularProgress, Grid, Typography } from "@material-ui/core";

function LoadingPage() {
  return (
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      justifyContent="center"
      style={{ minHeight: "100vh" }}
    >
      <Grid
        container
        direction="column"
        alignItems="center"
        justifyContent="center"
      >
        <Grid item>
          <CircularProgress
            style={{ color: "#008a7b", left: "auto", right: "auto" }}
          />
        </Grid>
        <Grid item>
          <Typography>Loading contents...</Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default LoadingPage;
