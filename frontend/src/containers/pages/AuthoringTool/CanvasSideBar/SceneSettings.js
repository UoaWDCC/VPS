import React, { useContext } from "react";
import TextField from "@material-ui/core/TextField";
import { withStyles } from "@material-ui/core/styles";
import { InputAdornment } from "@material-ui/core";
import SceneContext from "../../../../context/SceneContext";

import styles from "../../../../styling/CanvasSideBar.module.scss";

const CustomTextField = withStyles({
  root: {
    marginTop: "0.5em",
    marginBottom: "1.5em",

    "& label.Mui-focused": {
      color: "#0080a7 ",
    },
    "& .MuiInput-underline:after": {
      borderBottomColor: "0080a7",
    },
  },
})(TextField);

/**
 * This component displays the settings of a scene, such as the scene name
 * @component
 */
export default function SceneSettings() {
  const { currentScene, setCurrentScene } = useContext(SceneContext);

  return (
    <>
      <div className={styles.sceneSettingsContainer}>
        <h1 className={styles.sideBarHeader}>Scene Settings</h1>
        <div className={styles.sideBarBody}>
          {/* input for scene name */}
          <CustomTextField
            label="Scene Name"
            value={currentScene?.name}
            fullWidth
            onChange={(event) => {
              setCurrentScene({
                ...currentScene,
                name: event.target.value,
              });
            }}
          />
          {/* input for scene timer duration */}
          <CustomTextField
            label="Scene Timer Duration"
            type="number"
            value={currentScene?.time || ""}
            fullWidth
            onChange={(event) => {
              // limiting scene timer duration
              const timeInput = event.target.value < 0 ? 0 : event.target.value;

              setCurrentScene({
                ...currentScene,
                time: timeInput,
              });
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">seconds</InputAdornment>
              ),
            }}
            InputLabelProps={{
              // label moves up whenever there is input
              shrink: currentScene?.time || currentScene?.time === 0,
            }}
          />
        </div>
      </div>
    </>
  );
}
