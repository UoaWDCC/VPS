import React, { useContext, useEffect, useState } from "react";
import {
  FormControl,
  FormControlLabel,
  Checkbox,
  Button,
  TextField,
} from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrowRounded";
import PauseIcon from "@material-ui/icons/PauseRounded";
import SceneContext from "../../../../../context/SceneContext";
import CustomCheckBoxStyles from "../CustomPropertyInputStyles/CustomCheckBoxStyles";

import styles from "../../../../../styling/CanvasSideBar.module.scss";
import useStyles from "./FirebaseAudioPropertiesComponent.styles";

const CustomCheckBox = CustomCheckBoxStyles()(Checkbox);

export default function FirebaseAudioPropertiesComponent({
  component,
  componentIndex,
}) {
  const audioComponentStyles = useStyles();

  const { updateComponentProperty } = useContext(SceneContext);
  const [audio] = useState(new Audio(component.url));
  const [playing, setPlaying] = useState(false);

  const toggle = () => setPlaying(!playing);

  useEffect(() => {
    if (playing) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [playing]);

  useEffect(() => {
    audio.addEventListener("ended", () => setPlaying(false));
    return () => {
      audio.removeEventListener("ended", () => setPlaying(false));
    };
  }, []);

  function handleDeselect(e) {
    // Checks if currently focussed on div children
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setPlaying(false);
    }
  }

  return (
    <div onBlur={(e) => handleDeselect(e)}>
      <div className={`${styles.componentProperty}`}>
        {/* <CustomInputLabel shrink>Preview audio</CustomInputLabel> */}
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
    </div>
  );
}
