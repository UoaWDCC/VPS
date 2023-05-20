import React from "react";
import SpeechTextboxArrow from "components/SpeechboxArrow";
import { Typography } from "@material-ui/core";
import useStyles from "./components.styles";

const borderWidth = 3.429; // px

/**
 * This React component represents a speech text scene component
 * @component
 * @example
 * <SpeechTextComponent
 *    id={index}
 *    onClick={onClick}
 *    component={component}
 * />
 */
export default function SpeechTextComponent({ id, onClick, component }) {
  const { defaultComponentStyling, speechTextComponentStyles } =
    useStyles(component);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div className={defaultComponentStyling} onClick={onClick} id={id}>
      <SpeechTextboxArrow borderWidth={borderWidth} />

      <Typography style={{ borderWidth }} className={speechTextComponentStyles}>
        {component.text}
      </Typography>
    </div>
  );
}
