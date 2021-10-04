import { MenuItem } from "@material-ui/core";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import React, { useContext, useRef } from "react";
import SceneContext from "../../../../../context/SceneContext";
import styles from "../../../../../styling/ToolBar.module.scss";
import { addFirebaseImage } from "../ToolBarActions";

function UploadAudio() {
  const { currentScene, setCurrentScene } = useContext(SceneContext);
  const inputFile = useRef(null);

  const handleFileInput = async (e) => {
    const url = await URL.createObjectURL(e.target.files[0]);
    addFirebaseImage(currentScene, setCurrentScene, e.target.files[0], url);
    inputFile.current.value = null;
  };

  return (
    <div>
      <input
        type="file"
        ref={inputFile}
        style={{ display: "none" }}
        onChange={handleFileInput}
      />
      <MenuItem
        className={styles.menuItem}
        color="default"
        variant="contained"
        onClick={() => inputFile.current.click()}
      >
        <AttachFileIcon />
        &nbsp;&nbsp;Upload Audio
      </MenuItem>
    </div>
  );
}

export default UploadAudio;
