import { makeStyles } from "@material-ui/core";

export default function useStyles(component) {
  return makeStyles({
    testButton: {
      position: "absolute",
      height: `${component.height}`,
    },
  });
}
