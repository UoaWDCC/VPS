import { Button } from "@material-ui/core";
import React from "react";
import useStyles from "../components.styles";

export default function ButtonComponent({ id, selectElement, component }) {
  const styles = useStyles(component);

  return (
    <Button
      className={`btn top ${component.variant} ${component.colour} ${styles.defaultComponentStyling}`}
      color="default"
      variant={component.variant}
      id={id}
      onClick={selectElement}
    >
      {component.text}
    </Button>
  );
}
