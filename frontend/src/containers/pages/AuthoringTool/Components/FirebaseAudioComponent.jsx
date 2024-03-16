import { Box } from "@material-ui/core";
import VolumeUpIcon from "@material-ui/icons/VolumeUp";
import useStyles from "./components.styles";

/**
 * This component represents a firebase audio scene component
 * @component
 * @example
 * <FirebaseAudioComponent
 *    id={index}
 *    onClick={onClick}
 *    component={component}
 * />
 */
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
