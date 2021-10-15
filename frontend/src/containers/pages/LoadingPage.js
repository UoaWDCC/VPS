import React from "react";
import { CircularProgress, Grid, Typography } from "@material-ui/core";

/**
 * Component used to show a loading screen
 *
 * @component
 * @example
 * if (currentSceneId === null) {
    return <LoadingPage text="Loading contents..." />;
  }
 */
function LoadingPage({ text }) {
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
          <CircularProgress style={{ color: "#008a7b" }} />
        </Grid>
        <Grid item>
          <Typography>{text}</Typography>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default LoadingPage;
