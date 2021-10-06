import React, { useContext, useEffect, useState } from "react";
import {
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  IconButton,
} from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import PauseIcon from "@material-ui/icons/Pause";
import SceneContext from "../../../../../context/SceneContext";
import CustomInputLabelStyles from "../CustomPropertyInputStyles/CustomInputLabelStyles";
import CustomCheckBoxStyles from "../CustomPropertyInputStyles/CustomCheckBoxStyles";

import styles from "../../../../../styling/CanvasSideBar.module.scss";

const CustomInputLabel = CustomInputLabelStyles()(InputLabel);
const CustomCheckBox = CustomCheckBoxStyles()(Checkbox);

export default function FirebaseAudioPropertiesComponent({
  component,
  componentIndex,
}) {
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

  return (
    <>
      <div className={`${styles.componentProperty}`}>
        <CustomInputLabel shrink>Preview audio</CustomInputLabel>
        <IconButton onClick={toggle} size="large" color="primary">
          {playing ? (
            <PauseIcon fontSize="inherit" />
          ) : (
            <PlayArrowIcon fontSize="inherit" />
          )}
        </IconButton>
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
    </>
  );
}
