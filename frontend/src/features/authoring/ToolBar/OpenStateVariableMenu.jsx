import { MenuItem } from "@material-ui/core";
import { useState } from "react";
import styles from "./ToolBar.module.scss";
import StateVariableMenu from "../../../components/StateVariables/StateVariableMenu";

/**
 * Used to open the State Variable Menu
 * @component
 */
const OpenStateVariableMenu = () => {
  const [show, setShow] = useState(false);

  return (
    <div>
      <MenuItem
        className={styles.menuItem}
        color="default"
        variant="contained"
        onClick={() => setShow(true)}
      >
        Open State Menu
      </MenuItem>
      <StateVariableMenu show={show} setShow={setShow} />
    </div>
  );
};

export default OpenStateVariableMenu;
