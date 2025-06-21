import { MenuItem } from "@material-ui/core";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import Tooltip from "@material-ui/core/Tooltip";
import { useContext, useRef } from "react";
import SceneContext from "context/SceneContext";
import styles from "../ToolBar.module.scss";
import { addFirebaseImage } from "../ToolBarActions";

/**
 * This component is a dropdown item for the image button in the ToolBar.
 * It allows the user to upload image files.
 * @component
 */
export default function UploadImage() {
  const { currentScene, setCurrentScene } = useContext(SceneContext);
  const inputFile = useRef(null);

  const handleFileInput = async (e) => {
    const url = URL.createObjectURL(e.target.files[0]);
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
      <Tooltip
        title="Upload an image file from your device"
        placement="right"
        arrow
      >
        <MenuItem
          className={styles.menuItem}
          color="default"
          variant="contained"
          onClick={() => inputFile.current.click()}
        >
          <AttachFileIcon />
          &nbsp;&nbsp;Upload Image
        </MenuItem>
      </Tooltip>
    </div>
  );
}
