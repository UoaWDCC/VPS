import { makeStyles } from "@material-ui/core";

export default function useStyles() {
  return makeStyles({
    canvasContainer: {
      height: "100vh",
      width: "100vw",
      backgroundColor: "#CAF4F4",
    },
  })();
}
