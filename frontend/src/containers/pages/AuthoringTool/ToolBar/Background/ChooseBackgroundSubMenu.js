import React from "react";
import { MenuItem } from "@material-ui/core";
import CloudQueueIcon from "@material-ui/icons/CloudQueue";
import styles from "../../../../../styling/ToolBar.module.scss";
import ChooseBackgroundModal from "./ChooseBackgroundModal";
import useChooseBackgroundModal from "./useChooseBackgroundModal";

function ChooseBackgroundSubMenu() {
  const { isShowing, hide, show } = useChooseBackgroundModal();

  return (
    <MenuItem className={styles.menuItem} onClick={show}>
      <ChooseBackgroundModal isShowing={isShowing} hide={hide} />
      <CloudQueueIcon fontSize="medium" />
      &nbsp;&nbsp;Choose background
    </MenuItem>
  );
}

export default ChooseBackgroundSubMenu;
