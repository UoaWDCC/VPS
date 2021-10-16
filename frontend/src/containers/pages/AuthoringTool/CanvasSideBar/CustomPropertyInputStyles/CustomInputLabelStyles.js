import { withStyles } from "@material-ui/core/styles";

/**
 * This function contains the styles for input labels of scene component properties
 */
export default function CustomInputLabelStyles() {
  return withStyles({
    root: {
      whiteSpace: "nowrap",
      "&.Mui-focused": {
        color: "#008a7b",
      },
    },
  });
}
