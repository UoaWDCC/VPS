import { MenuItem } from "@material-ui/core";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import React, { useContext, useRef } from "react";
import SceneContext from "../../../../../context/SceneContext";
import ToolbarContext from "../../../../../context/ToolbarContext";
import styles from "../../../../../styling/ToolBar.module.scss";
import { addFirebaseAudio } from "../ToolBarActions";

/**
 * This component is a dropdown item for the audio button in the ToolBar.
 * It allows the user to upload mp3 files.
 * @component
 */
function UploadAudio() {
  const { currentScene, setCurrentScene } = useContext(SceneContext);
  const { handleDropdownClose } = useContext(ToolbarContext);
  const inputFile = useRef(null);

  const handleFileInput = async (e) => {
    const url = await URL.createObjectURL(e.target.files[0]);
    addFirebaseAudio(currentScene, setCurrentScene, e.target.files[0], url);
    inputFile.current.value = null;
    handleDropdownClose();
  };

  return (
    <div>
      <input
        type="file"
        accept=".mp3"
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
