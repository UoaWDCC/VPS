import { Button } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import useStyles from "./components.styles";

/**
 * This component represents a button scene component
 * @component
 * @example
 * <ButtonComponent
 *    id={index}
 *    onClick={onClick}
 *    component={component}
 * />
 */
export default function ButtonComponent({ id, onClick, component, zoomLevel }) {
  const styles = useStyles(component);
  const userDefinedWidth = component.width;
  const userDefinedHeight = component.height;

  return (
    <Button
      style={{
        zIndex: component?.zPosition || 0,
        width: `${userDefinedWidth * zoomLevel}%`,
        height: `${userDefinedHeight * zoomLevel}%`,
      }}
      className={
        `btn ${component.variant} ${component.colour} ${styles.defaultComponentStyling}` +
        (component?.hover ? ` ${styles.hover}` : " ")
      }
      color="default"
      id={id}
      variant={component.variant}
      onClick={onClick}
    >
      {component.text}
    </Button>
  );
}
