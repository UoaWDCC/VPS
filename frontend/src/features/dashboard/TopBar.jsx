import Button from "@material-ui/core/Button";
import { Link, useHistory } from "react-router-dom";

import styles from "../../components/TopBar/TopBar.module.scss";

/**
 * Component used for navigation and executing actions located at the top of the screen.
 *
 * @component
 * @example
 * const back = "/"
 * const confirmModel = true
 * return (
 *   <TopBar back={back} confirmModel={confirmModel}>
 *     { ... }
 *   </TopBar>
 * )
 */
export default function TopBar({
  back = "/",
  children = [],
  confirmModal = false,
}) {
  const history = useHistory();

  /**
   * Function for changing variables to their appropriate states when the back button is pressed.
   */
  function handleLeaveAuthoringTool() {
    history.push("/");
  }

  return (
    <>
      <div className={styles.topBar}>
        <ul className={styles.leftTopBarList}>
          <li className={styles.listItem}>
            {confirmModal ? (
              <button className="btn vps" onClick={handleLeaveAuthoringTool}>
                Back
              </button>
            ) : (
              <button className="btn vps" onClick={history.push(back)}>
                Back
              </button>
            )}
          </li>
        </ul>
        <ul className={styles.rightTopBarList}>
          <li className={styles.listItem}>{children}</li>
        </ul>
      </div>
    </>
  );
}
