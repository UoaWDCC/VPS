import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  TextField,
  Typography,
  InputLabel,
} from "@material-ui/core";
import PauseIcon from "@material-ui/icons/PauseRounded";
import PlayArrowIcon from "@material-ui/icons/PlayArrowRounded";
import { useContext, useEffect, useState } from "react";
import SceneContext from "context/SceneContext";
import CustomCheckBoxStyles from "features/authoring/CanvasSideBar/CustomPropertyInputStyles/CustomCheckBoxStyles";
import CustomInputLabelStyles from "features/authoring/CanvasSideBar/CustomPropertyInputStyles/CustomInputLabelStyles";
import {
  handleSendToBack,
  handleBringToFront,
  handleMoveBackward,
  handleMoveForward,
} from "./utils/zAxisUtils";

import styles from "../CanvasSideBar.module.scss";
import useStyles from "./FirebaseAudioPropertiesComponent.styles";

const CustomCheckBox = CustomCheckBoxStyles()(Checkbox);
const CustomInputLabel = CustomInputLabelStyles()(InputLabel);

/**
 * This component displays the properties in the sidebar for a audio scene component.
 * @component
 */
export default function FirebaseAudioPropertiesComponent({
  component,
  componentIndex,
}) {
  const audioComponentStyles = useStyles();

  const { updateComponentProperty, currentScene } = useContext(SceneContext);
  const [audio, setAudio] = useState(new Audio(component.url));
  const [playing, setPlaying] = useState(false);

  const toggle = () => setPlaying(!playing);

  useEffect(() => {
    setAudio(new Audio(component.url));
  }, [component]);

  useEffect(() => {
    if (playing) {
      audio.play();
    } else {
      audio.pause();
    }

    return () => {
      audio.pause();
    };
  }, [playing]);

  useEffect(() => {
    audio.addEventListener("ended", () => setPlaying(false));
    return () => {
      audio.removeEventListener("ended", () => setPlaying(false));
    };
  }, [audio]);

  function handleDeselect(e) {
    // Checks if currently focussed on div children
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setPlaying(false);
    }
  }

  return (
    <div onBlur={(e) => handleDeselect(e)}>
      <div className={`${styles.componentProperty}`}>
        <TextField
          label="Audio"
          value={component.name}
          fullWidth
          InputProps={{
            readOnly: true,
          }}
        />
        <Button
          className={audioComponentStyles.playButton}
          onClick={toggle}
          size="small"
          color="primary"
          variant="contained"
        >
          {playing ? <PauseIcon /> : <PlayArrowIcon />}
        </Button>
      </div>

      <FormControl fullWidth className={styles.componentProperty}>
        <FormControlLabel
          control={
            <CustomCheckBox
              checked={component.loop}
              color="default"
              onChange={(event) =>
                updateComponentProperty(
                  componentIndex,
                  "loop",
                  event.target.checked
                )
              }
            />
          }
          label="Loop"
        />
      </FormControl>
      <FormControl fullWidth className={styles.componentProperty}>
        <CustomInputLabel shrink>Z Axis Position</CustomInputLabel>
        <Typography
          variant="body2"
          style={{
            marginTop: "0.5em",
            marginBottom: "0.5em",
            textAlign: "center",
          }}
        >
          Current Z: {component?.zPosition ?? 0}
        </Typography>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5em",
            marginTop: "0.5em",
            width: "100%",
          }}
        >
          <Button
            variant="outlined"
            style={{ fontSize: "0.50rem" }}
            onClick={() =>
              handleMoveBackward({
                component,
                componentIndex,
                updateComponentProperty,
              })
            }
          >
            Move Backward
          </Button>
          <Button
            variant="outlined"
            style={{ fontSize: "0.50rem" }}
            onClick={() =>
              handleMoveForward({
                component,
                componentIndex,
                updateComponentProperty,
              })
            }
          >
            Move Forward
          </Button>
          <Button
            variant="outlined"
            onClick={() =>
              handleSendToBack({
                currentScene,
                component,
                componentIndex,
                updateComponentProperty,
              })
            }
            fullWidth
            style={{ fontSize: "0.50rem" }}
          >
            Send to Back
          </Button>
          <Button
            variant="outlined"
            onClick={() =>
              handleBringToFront({
                currentScene,
                component,
                componentIndex,
                updateComponentProperty,
              })
            }
            fullWidth
            style={{ fontSize: "0.50rem" }}
          >
            Bring to Front
          </Button>
        </div>
      </FormControl>
    </div>
  );
}
