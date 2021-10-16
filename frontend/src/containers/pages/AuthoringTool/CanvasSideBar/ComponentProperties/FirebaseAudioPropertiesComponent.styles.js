import { makeStyles } from "@material-ui/core";
/**
 * This function contains the styles for the FirebaseAudioPropertiesComponent.
 */
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
