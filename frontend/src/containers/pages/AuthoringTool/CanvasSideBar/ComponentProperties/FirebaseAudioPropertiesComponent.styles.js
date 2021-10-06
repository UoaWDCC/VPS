import { makeStyles } from "@material-ui/core";

export default function useStyles() {
  return makeStyles({
    playButton: {
      float: "right",
      minWidth: "20px",
      gap: "2em",
      marginTop: "1em",
    },
  })();
}
