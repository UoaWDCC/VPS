import { Typography } from "@material-ui/core";
import AuthoringToolContext from "context/AuthoringToolContext";
import { useContext } from "react";
import useStyles from "./components.styles";
import { toRgbaString } from "../../../utils/colourUtils";
import useScaledFontSize from "../../../hooks/useScaledFontSize";

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

  const baseFontSize = component.fontSize || 16;
  const scaledFontSize = useScaledFontSize(baseFontSize);

  const textStyles = {
    zIndex: component?.zPosition || 0,
    color: toRgbaString(component.colour),
    fontSize: `${scaledFontSize}px`,
  };

  return (
    <Typography
      className={`${styles.defaultComponentStyling} ${styles.textComponentStyles}`}
      id={id}
      onClick={onClick}
      onDoubleClick={() => textRef?.current?.focus()}
      style={textStyles}
    >
      {component.text}
    </Typography>
  );
}
