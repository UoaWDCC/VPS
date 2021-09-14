import { Button, makeStyles } from "@material-ui/core";
import React from "react";

const useStyles = makeStyles({
  testButton: {
    position: "absolute",
  },
});

export default function TestButtonComponent({ id, selectElement }) {
  const styles = useStyles();
  return (
    <Button
      className={`btn top contained white ${styles.testButton}`}
      color="default"
      variant="contained"
      id={id}
      onClick={selectElement}
    >
      TEST COMPONENT
    </Button>
  );
}
