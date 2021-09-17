import { Typography } from "@material-ui/core";
import React from "react";
import useStyles from "./components.styles";

export default function TextComponent({ id, selectElement, component }) {
  const styles = useStyles(component);
  // Potential properties
  // Border
  // Text
  // font size
  // font color
  // alignment
  // bold/italics?
  return (
    <Typography
      className={`${styles.defaultComponentStyling}`}
      id={id}
      onClick={() => console.log("text clicked")}
    >
      {component.text}
    </Typography>
  );
}
