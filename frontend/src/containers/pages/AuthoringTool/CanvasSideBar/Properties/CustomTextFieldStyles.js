import { withStyles } from "@material-ui/core/styles";

export default function CustomTextFieldStyles() {
  return withStyles({
    root: {
      "& label.Mui-focused": {
        color: "#008a7b",
      },
      "& .MuiInput-underline:after": {
        borderBottomColor: "#008a7b",
      },
    },
  });
}
