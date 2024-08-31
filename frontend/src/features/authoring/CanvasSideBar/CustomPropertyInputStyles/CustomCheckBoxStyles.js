import { withStyles } from "@material-ui/core/styles";

/**
 * This function contains the styles for checkbox components of scene component properties
 */
export default function CustomCheckBoxStyles() {
  return withStyles({
    root: {
      "&.Mui-checked": {
        color: "#0080a7",
      },
      paddingLeft: "0.75em",
      paddingRight: "0.75em",
    },
  });
}
