import { MenuItem } from "@material-ui/core";
import CloudQueueIcon from "@material-ui/icons/CloudQueue";
import Tooltip from "@material-ui/core/Tooltip";
import styles from "../ToolBar.module.scss";
import ChooseBackgroundModal from "./ChooseBackgroundModal";
import useChooseBackgroundModal from "./useChooseBackgroundModal";

/**
 * This component is the submenu for for background component
 * Beaware that the modal needs to be rendered outside of the MenuItem: https://stackoverflow.com/a/41991884
 * @component
 */
function ChooseBackgroundSubMenu() {
  const { isShowing, hide, show } = useChooseBackgroundModal();
  return (
    <>
      <Tooltip
        title="Choose an image that is already uploaded"
        placement="right"
        arrow
      >
        <MenuItem className={styles.menuItem} onClick={show}>
          <CloudQueueIcon fontSize="medium" />
          &nbsp;&nbsp;Choose Image
        </MenuItem>
      </Tooltip>
      <ChooseBackgroundModal isShowing={isShowing} hide={hide} />
    </>
  );
}

export default ChooseBackgroundSubMenu;
