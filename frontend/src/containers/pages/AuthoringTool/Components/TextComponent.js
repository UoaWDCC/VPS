import { Typography } from "@material-ui/core";
import React from "react";
import useStyles from "./components.styles";

/**
 * This component represents a text scene component
 * @component
 * @example
 * <TextComponent
 *    id={index}
 *    onClick={onClick}
 *    component={component}
 * />
 */
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
