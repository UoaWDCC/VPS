import { Button } from "@material-ui/core";
import React from "react";
import useStyles from "./components.styles";

export default function ButtonComponent({ id, onClick, component }) {
  const styles = useStyles(component);

  return (
    <Button
      className={`btn ${component.variant} ${component.colour} ${styles.defaultComponentStyling}`}
      color="default"
      variant={component.variant}
      id={id}
      onClick={onClick}
    >
      {component.text}
    </Button>
  );
}
