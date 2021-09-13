import { Box, Button, makeStyles } from "@material-ui/core";
import React from "react";

const useStyles = makeStyles({
  box: {
    backgroundColor: "#008a7b",
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
  },
});

export default function BoxComponent({ id, selectElement }) {
  const styles = useStyles();
  return (
    <Box
      className={styles.box}
      width={100}
      height={100}
      key={id}
      id={id}
      onClick={selectElement}
    >
      Hello World
    </Box>
  );
}
