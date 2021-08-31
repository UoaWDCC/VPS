import React from "react";
import TextField from "@material-ui/core/TextField";
import { withStyles } from "@material-ui/core/styles";

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
  return (
    <>
      <div className={styles.sceneSettingsContainer}>
        <h1 className={styles.sideBarHeader}>Scene Settings</h1>
        <div className={styles.sideBarBody}>
          <CustomTextField label="Scene Name" value="Scene" fullWidth />
        </div>
      </div>
    </>
  );
}
