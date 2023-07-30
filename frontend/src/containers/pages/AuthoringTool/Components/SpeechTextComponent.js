import React, { useState, useContext } from "react";
import AuthoringToolContext from "context/AuthoringToolContext";
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
  const [speechTextboxArrowWidth, setArrowWidth] = useState(null);
  const context = useContext(AuthoringToolContext);
  const textRef = context?.propertiesRefs?.text;
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div
      className={defaultComponentStyling}
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: speechTextboxArrowWidth + 10, // speechbox slightly wider than arrow
      }}
      onClick={onClick}
      onDoubleClick={() => textRef?.current?.focus()}
      id={id}
    >
      <SpeechTextboxArrow
        borderWidth={borderWidth}
        setArrowWidth={setArrowWidth}
      />

      <Typography
        style={{
          borderWidth,
          flex: 1,
          borderRadius: "10px",
          borderTopRightRadius: 0,
        }}
        className={speechTextComponentStyles}
      >
        {component.text}
      </Typography>
    </div>
  );
}
