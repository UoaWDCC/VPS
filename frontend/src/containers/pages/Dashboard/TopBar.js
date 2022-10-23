import React from "react";
import { Link, useHistory } from "react-router-dom";
import Button from "@material-ui/core/Button";

import styles from "../../../styling/TopBar.module.scss";

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
              <Button
                className="btn top outlined white"
                color="default"
                variant="outlined"
                onClick={handleLeaveAuthoringTool}
              >
                Back
              </Button>
            ) : (
              <Button
                className="btn top outlined white"
                color="default"
                variant="outlined"
                component={Link}
                to={back}
              >
                Back
              </Button>
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
