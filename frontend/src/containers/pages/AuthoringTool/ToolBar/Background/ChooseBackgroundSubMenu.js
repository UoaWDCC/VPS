import React from "react";
import { MenuItem } from "@material-ui/core";
import CloudQueueIcon from "@material-ui/icons/CloudQueue";
import styles from "../../../../../styling/ToolBar.module.scss";
import ChooseBackgroundModal from "./ChooseBackgroundModal";
import useChooseBackgroundModal from "./useChooseBackgroundModal";

/* This component is the submenu for for background component
 * Beaware that the modal needs to be rendered outside of the MenuItem: https://stackoverflow.com/a/41991884
 * */
function ChooseBackgroundSubMenu() {
  const { isShowing, hide, show } = useChooseBackgroundModal();
  return (
    <>
      <MenuItem
        className={styles.menuItem}
        onClick={() => {
          console.log("yesme");
          show();
        }}
      >
        <CloudQueueIcon fontSize="medium" />
        &nbsp;&nbsp;Choose background
      </MenuItem>
      <ChooseBackgroundModal isShowing={isShowing} hide={hide} />
    </>
  );
}

export default ChooseBackgroundSubMenu;
