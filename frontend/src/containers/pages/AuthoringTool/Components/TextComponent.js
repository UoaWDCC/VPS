import { Typography } from "@material-ui/core";
import React from "react";
import useStyles from "./components.styles";

export default function TextComponent({ id, onClick, component }) {
  const styles = useStyles(component);

  return (
    <Typography
      className={`${styles.defaultComponentStyling} ${styles.textComponentStyles}`}
      id={id}
      onClick={onClick}
    >
      {component.text}
    </Typography>
  );
}
