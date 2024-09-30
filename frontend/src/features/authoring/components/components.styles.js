import { makeStyles } from "@material-ui/core";

/**
 * This file contains all the styles used to override material-ui components which are being used within a component.
 */
export default function useStyles(component) {
  return makeStyles({
    defaultComponentStyling: {
      position: "absolute",
      top: `${component.top}%`,
      left: `${component.left}%`,
      height: `${component.height}%`,
      width: `${component.width}%`,
      boxSizing: "border-box",
    },
    textComponentStyles: {
      borderStyle: component.border ? "solid" : "none",
      borderColor: "black",
      backgroundColor: component.border ? "white" : "none",
      fontSize: component.fontSize,
      paddingInline: "5px",
      overflow: "hidden",
      color: component.color, // text colour
      textAlign: component.textAlign,
      whiteSpace: "pre-wrap",
    },
    speechTextComponentStyles: {
      borderStyle: "solid",
      borderColor: "black",
      backgroundColor: "white",
      fontSize: component.fontSize,
      paddingInline: "5px",
      overflow: "hidden",
      color: component.color, // text colour
      textAlign: component.textAlign,
      whiteSpace: "pre-wrap",
    },
    audioComponentStyles: {
      color: "#999999",
      width: "100%",
      height: "100%",
    },
  })();
}

export function imageStyles(component, zoomLevel) {
  return {
    maxHeight: "100%",
    maxWidth: "100%",
    width:
      component.width === "auto"
        ? component.width
        : `${component.width * zoomLevel}%`,
    height:
      component.height === "auto"
        ? component.height
        : `${component.height * zoomLevel}%`,
    top: `${component.top}%`,
    left: `${component.left}%`,
  };
}

export function imageContainerStyles() {
  return {
    display: "contents",
  };
}
