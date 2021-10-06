import React from "react";
import VolumeUpIcon from "@material-ui/icons/VolumeUp";
import useStyles from "./components.styles";

export default function FirebaseAudioComponent({ id, onClick, component }) {
  const styles = useStyles(component);

  return (
    <VolumeUpIcon
      className={`${styles.defaultComponentStyling} ${styles.audioComponentStyles}`}
      id={id}
      onClick={onClick}
    />
  );
}
