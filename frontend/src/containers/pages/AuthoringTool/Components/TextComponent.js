import { Typography } from "@material-ui/core";
import React from "react";
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
  const handleDoubleClick = () => {
    const reference = document.querySelector("textarea");
    reference.focus();
  };

  const styles = useStyles(component);
  // const { updateComponentProperty } = useContext(SceneContext);

  return (
    <Typography
      className={`${styles.defaultComponentStyling} ${styles.textComponentStyles}`}
      id={id}
      onClick={onClick}
      onDoubleClick={handleDoubleClick}
    >
      {component.text}
    </Typography>
  );
}
