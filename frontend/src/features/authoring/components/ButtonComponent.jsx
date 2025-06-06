import useStyles from "./components.styles";
import useScaledFontSize from "../../../hooks/useScaledFontSize";

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
export default function ButtonComponent({ id, onClick, component }) {
  const styles = useStyles(component);

  const baseFontSize = component.fontSize || 16;
  const scaledFontSize = useScaledFontSize(baseFontSize);

  const buttonStyles = {
    zIndex: component?.zPosition || 0,
    backgroundColor:
      component.variant === "contained"
        ? `rgba(${component.colour.r}, ${component.colour.g}, ${component.colour.b}, ${component.colour.a})`
        : "transparent",
    color: "#0080a7",
    fontSize: `${scaledFontSize}px`,
  };

  return (
    // <Button
    //   style={{ zIndex: component?.zPosition || 0 }}
    //   className={`btn ${component.variant} ${component.colour} ${styles.defaultComponentStyling}`}
    //   color="default"
    //   id={id}
    //   variant={component.variant}
    //   onClick={onClick}
    // >
    //   {component.text}
    // </Button>
    <button
      className={`btn ${component.variant} ${component.colour} ${styles.defaultComponentStyling}`}
      id={id}
      onClick={onClick}
      style={buttonStyles}
    >
      {component.text}
    </button>
  );
}
