import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  TextField,
} from "@material-ui/core";
import PauseIcon from "@material-ui/icons/PauseRounded";
import PlayArrowIcon from "@material-ui/icons/PlayArrowRounded";
import { useContext, useEffect, useState } from "react";
import SceneContext from "context/SceneContext";
import CustomCheckBoxStyles from "features/authoring/CanvasSideBar/CustomPropertyInputStyles/CustomCheckBoxStyles";
import CustomTextFieldStyles from "features/authoring/CanvasSideBar/CustomPropertyInputStyles/CustomTextFieldStyles";

import styles from "../CanvasSideBar.module.scss";
import useStyles from "./FirebaseAudioPropertiesComponent.styles";

const CustomTextField = CustomTextFieldStyles()(TextField);
const CustomCheckBox = CustomCheckBoxStyles()(Checkbox);

/**
 * This component displays the properties in the sidebar for a audio scene component.
 * @component
 */
export default function FirebaseAudioPropertiesComponent({
  component,
  componentIndex,
}) {
  const audioComponentStyles = useStyles();

  const { updateComponentProperty } = useContext(SceneContext);
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
        <CustomTextField
          label="Z Axis Position"
          type="number"
          value={component?.zPosition || ""}
          fullWidth
          onChange={(event) =>
            updateComponentProperty(
              componentIndex,
              "zPosition",
              event.target.value
            )
          }
          InputLabelProps={{
            // label moves up whenever there is input
            shrink: !!component.zPosition,
          }}
        />
      </FormControl>
    </div>
  );
}
