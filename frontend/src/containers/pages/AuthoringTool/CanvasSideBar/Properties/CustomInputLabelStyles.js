import { withStyles } from "@material-ui/core/styles";

export default function CustomInputLabelStyles() {
  return withStyles({
    root: {
      "&.Mui-focused": {
        color: "#008a7b",
      },
    },
  });
}
