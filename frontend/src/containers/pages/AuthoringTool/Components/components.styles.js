import { makeStyles } from "@material-ui/core";

export default function useStyles(component) {
  return makeStyles({
    defaultComponentStyling: {
      position: "absolute",
      top: `${component.top}%`,
      left: `${component.left}%`,
      transform: `translate(-${component.top}%, -${component.left}%)`,
      height: `${component.height}%`,
      width: `${component.width}%`,
    },
  })();
}

export function imageStyles(component) {
  return {
    maxHeight: "100%",
    maxWidth: "100%",
    width: component.width === "auto" ? component.width : `${component.width}%`,
    height:
      component.height === "auto" ? component.height : `${component.height}%`,
    top: `${component.top}%`,
    left: `${component.left}%`,
  };
}

export function imageContainerStyles(component) {
  return {
    display: "contents",
    cursor: "pointer",
  };
}
