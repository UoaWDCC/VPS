import React from "react";
import VolumeUpIcon from "@material-ui/icons/VolumeUp";
import { Box } from "@material-ui/core";
import useStyles from "./components.styles";

export default function FirebaseAudioComponent({ id, onClick, component }) {
  const styles = useStyles(component);

  return (
    <Box className={styles.defaultComponentStyling} id={id} onClick={onClick}>
      <VolumeUpIcon
        className={styles.audioComponentStyles}
        fontSize="inherit"
      />
    </Box>
  );
}
