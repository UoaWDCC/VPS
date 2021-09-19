import { withStyles } from "@material-ui/core/styles";

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
