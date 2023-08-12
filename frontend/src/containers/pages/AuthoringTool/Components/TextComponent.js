import { Typography } from "@material-ui/core";
import React, { useContext } from "react";
import AuthoringToolContext from "context/AuthoringToolContext";
import useStyles from "./components.styles";
// import TextPropertiesComponent from "../CanvasSideBar/ComponentProperties/TextPropertiesComponent";

/**
 * This component represents a text scene component
 * @component
 * @example
 * <TextComponent
 *    id={index}
 *    onClick={onClick}
 *    component={component}
 *    onDoubleClick={handleDoubleClick}
 * />
 */
export default function TextComponent({ id, onClick, component }) {
  const styles = useStyles(component);

  const context = useContext(AuthoringToolContext);
  const textRef = context?.propertiesRefs?.text;

  return (
    <Typography
      className={`${styles.defaultComponentStyling} ${styles.textComponentStyles}`}
      id={id}
      onClick={onClick}
      onDoubleClick={() => textRef?.current?.focus()}
    >
      {component.text}
    </Typography>
  );
}
