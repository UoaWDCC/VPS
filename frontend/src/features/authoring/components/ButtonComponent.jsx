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
export default function ButtonComponent({ id, onClick, component }) {
  const styles = useStyles(component);

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
      style={{ zIndex: component?.zPosition || 0 }}
    >
      {component.text}
    </button>
  );
}
