import React from "react";
import LinearProgress from "@mui/material/LinearProgress";

const ProgressBar = ({ value }) => {
  const styles = {
    height: 10,
    width: "100%",
    position: "relative",
    color: "#00bda7",
  };

  return (
    <>
      <LinearProgress
        style={styles}
        variant="determinate"
        value={value}
        color="inherit"
      />
    </>
  );
};

ProgressBar.defaultProps = {
  value: 0,
};

export default ProgressBar;
