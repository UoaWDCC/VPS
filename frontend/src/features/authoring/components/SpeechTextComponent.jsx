import { Typography } from "@material-ui/core";
import SpeechTextboxArrow from "components/SpeechboxArrow/SpeechboxArrow";
import AuthoringToolContext from "context/AuthoringToolContext";
import { useContext, useState } from "react";
import useStyles from "./components.styles";
import { toRgbaString } from "../../../utils/colourUtils";

const borderWidth = 3.429; // px

/**
 * @param {number} borderRadius
 * @param {string} squareCorner
 * @returns {string} borderRadius CSS value
 */
function formatRadius(borderRadius, squareCorner) {
  const diffRadii = new Array(4).fill(`${borderRadius}px`);

  const position = {
    TopLeft: 0,
    TopRight: 1,
    BottomRight: 2,
    BottomLeft: 3,
  }[squareCorner];

  diffRadii[position] = "0"; // this is the square corner

  return diffRadii.join(" ");
}

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

  // style related values
  const speechboxWidthOffset = 10;
  const colour = toRgbaString(component.colour);
  const arrowLocation = component.arrowLocation || "right";
  const arrowLocationStyles = {
    top: { flexDirection: "column", squareCorner: "TopRight" },
    bottom: {
      flexDirection: "column-reverse",
      squareCorner: "BottomLeft",
    },
    left: { flexDirection: "row", squareCorner: "TopLeft" },
    right: {
      flexDirection: "row-reverse",
      squareCorner: "BottomRight",
    },
  }[arrowLocation];

  return (
    <div
      className={defaultComponentStyling}
      style={{
        display: "flex",
        flexDirection: arrowLocationStyles.flexDirection,
        minWidth: speechTextboxArrowWidth + speechboxWidthOffset, // speechbox slightly wider than arrow
        zIndex: component?.zPosition || 0,
      }}
      onClick={onClick}
      onDoubleClick={() => textRef?.current?.focus()}
      id={id}
    >
      <SpeechTextboxArrow
        borderWidth={borderWidth}
        setArrowWidth={setArrowWidth}
        arrowLocation={arrowLocation}
      />

      <Typography
        style={{
          borderWidth,
          flex: 1,
          borderRadius: formatRadius(
            speechboxWidthOffset,
            arrowLocationStyles.squareCorner
          ),
          color: colour,
        }}
        className={speechTextComponentStyles}
      >
        {component.text}
      </Typography>
    </div>
  );
}
