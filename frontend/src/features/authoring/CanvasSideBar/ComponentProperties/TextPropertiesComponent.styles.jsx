import { makeStyles } from "@material-ui/core";

/**
 * This function contains the styles for the TextPropertiesComponent
 */
export default function useStyles() {
  return makeStyles({
    textArea: {
      marginTop: "1em",
    },
    inlineRow: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      minWidth: "fit-content",
      flexWrap: "wrap",
      gap: "2em",
    },
  })();
}
