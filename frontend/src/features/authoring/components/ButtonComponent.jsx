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
export default function ButtonComponent({ id, onClick, component, isEditing }) {
  const styles = useStyles(component);
  const [zoomLevel, setZoomLevel] = useState(1);
  const userDefinedWidth = component.width;
  const userDefinedHeight = component.height;

  useEffect(() => {
    const handleResize = () => {
      if (isEditing) {
        setZoomLevel(1);
        return;
      }
      setZoomLevel(window.devicePixelRatio);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  console.log(`Zoom level: ${zoomLevel}`);
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
