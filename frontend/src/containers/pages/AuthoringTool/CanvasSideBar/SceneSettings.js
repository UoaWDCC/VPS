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
      color: "#008a7b",
    },
    "& .MuiInput-underline:after": {
      borderBottomColor: "#008a7b",
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
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">seconds</InputAdornment>
              ),
            }}
          />
        </div>
      </div>
    </>
  );
}
