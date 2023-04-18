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
    },
  });
}
