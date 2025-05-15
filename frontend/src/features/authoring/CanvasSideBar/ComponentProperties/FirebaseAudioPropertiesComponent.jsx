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

  const handleSendToBack = () => {
    if (!currentScene || !currentScene.components) return;

    const zPositions = currentScene.components
      .map((c) => c.zPosition)
      .filter((z) => typeof z === "number");

    const minZ = zPositions.length > 0 ? Math.min(...zPositions) : 0;

    if ((component?.zPosition ?? 0) === minZ) {
      if (zPositions.length > 0 || (component?.zPosition ?? 0) < 0) {
        return;
      }
    }
    if ((component?.zPosition ?? 0) < minZ) {
      return;
    }
    updateComponentProperty(componentIndex, "zPosition", minZ - 1);
  };

  const handleBringToFront = () => {
    if (!currentScene || !currentScene.components) return;

    const zPositions = currentScene.components
      .map((c) => c.zPosition)
      .filter((z) => typeof z === "number");

    const maxZ = zPositions.length > 0 ? Math.max(...zPositions) : 0;

    if ((component?.zPosition ?? 0) === maxZ) {
      if (zPositions.length > 0 || (component?.zPosition ?? 0) > 0) {
        return;
      }
    }
    if ((component?.zPosition ?? 0) > maxZ) {
      return;
    }
    updateComponentProperty(componentIndex, "zPosition", maxZ + 1);
  };

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
              updateComponentProperty(
                componentIndex,
                "zPosition",
                (component?.zPosition ?? 0) - 1
              )
            }
          >
            Move Backward
          </Button>
          <Button
            variant="outlined"
            style={{ fontSize: "0.50rem" }}
            onClick={() =>
              updateComponentProperty(
                componentIndex,
                "zPosition",
                (component?.zPosition ?? 0) + 1
              )
            }
          >
            Move Forward
          </Button>
          <Button
            variant="outlined"
            onClick={handleSendToBack}
            fullWidth
            style={{ fontSize: "0.50rem" }}
          >
            Send to Back
          </Button>
          <Button
            variant="outlined"
            onClick={handleBringToFront}
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
