import { Button, makeStyles } from "@material-ui/core";
import React from "react";

export default function ButtonComponent({ id, selectElement, component }) {
  const useStyles = makeStyles({
    buttonComponent: {
      position: "absolute",
      top: `${component.top}%`,
      left: `${component.left}%`,
      transform: `translate(-${component.top}%, -${component.left}%)`,
      height: `${component.height}%`,
      width: `${component.width}%`,
    },
  });

  const styles = useStyles();
  return (
    <Button
      className={`btn top ${component.variant} ${component.colour} ${styles.buttonComponent}`}
      color="default"
      variant={component.variant}
      id={id}
      onClick={selectElement}
    >
      {component.text}
    </Button>
  );
}
