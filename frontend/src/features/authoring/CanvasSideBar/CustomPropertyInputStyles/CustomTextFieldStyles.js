import { withStyles } from "@material-ui/core/styles";

/**
 * This function contains the styles for text fields of scene component properties
 */
export default function CustomTextFieldStyles() {
  return withStyles({
    root: {
      "& label.Mui-focused": {
        color: "#0080a7",
      },
      "& .MuiInput-underline:after": {
        borderBottomColor: "#0080a7",
      },
    },
  });
}
