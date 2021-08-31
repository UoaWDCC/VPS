import React, { useContext } from "react";
import TextField from "@material-ui/core/TextField";
import { withStyles } from "@material-ui/core/styles";
import SceneContext from "../../../../context/SceneContext";

import styles from "../../../../styling/CanvasSideBar.module.scss";

const CustomTextField = withStyles({
  root: {
    "& label.Mui-focused": {
      color: "#008a7b",
    },
    "& .MuiInput-underline:after": {
      borderBottomColor: "#008a7b",
    },
  },
})(TextField);

export default function SceneSettings() {
  const { currentScene, setCurrentScene } = useContext(SceneContext);

  return (
    <>
      <div className={styles.sceneSettingsContainer}>
        <h1 className={styles.sideBarHeader}>Scene Settings</h1>
        <div className={styles.sideBarBody}>
          <CustomTextField
            label="Scene Name"
            value={currentScene.name}
            fullWidth
            onChange={(event) => {
              setCurrentScene({
                ...currentScene,
                name: event.target.value,
              });
            }}
          />
        </div>
      </div>
    </>
  );
}
