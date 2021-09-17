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
