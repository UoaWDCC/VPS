import { Typography } from "@material-ui/core";
import AuthoringToolContext from "context/AuthoringToolContext";
import { useContext } from "react";
import useStyles from "./components.styles";

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
export default function TextComponent({ id, onClick, component, zoomLevel }) {
  const styles = useStyles(component);
  const userDefinedWidth = component.width;
  const userDefinedHeight = component.height;

  const context = useContext(AuthoringToolContext);
  const textRef = context?.propertiesRefs?.text;

  return (
    <Typography
      className={`${styles.defaultComponentStyling} ${styles.textComponentStyles}`}
      id={id}
      onClick={onClick}
      onDoubleClick={() => textRef?.current?.focus()}
      style={{
        zIndex: component?.zPosition || "0",
        width: `${userDefinedWidth * zoomLevel}%`,
        height: `${userDefinedHeight * zoomLevel}%`,
      }}
    >
      {component.text}
    </Typography>
  );
}
