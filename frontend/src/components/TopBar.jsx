import Button from "@material-ui/core/Button";
import { useContext, useState } from "react";
import { Link, useHistory } from "react-router-dom";

import BackModal from "../containers/pages/AuthoringTool/BackModal";
import AuthoringToolContext from "../context/AuthoringToolContext";
import ScenarioContext from "../context/ScenarioContext";
import SceneContext from "../context/SceneContext";
import styles from "../styling/TopBar.module.scss";

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
  confirmModal = false,
  children = [],
}) {
  const [showModal, setShowModal] = useState(false);
  const { hasChange, setMonitorChange } = useContext(SceneContext);
  const { currentScenario } = useContext(ScenarioContext);
  let setSelect;
  if (confirmModal) {
    setSelect = useContext(AuthoringToolContext).setSelect;
  }
  const history = useHistory();

  /**
   * Function for changing variables to their appropriate states when the back button is pressed.
   */
  function handleLeaveAuthoringTool() {
    if (setSelect) {
      /** Deselect any components */
      setSelect(null);
    }

    if (!hasChange) {
      setMonitorChange(false);
      history.push(`/scenario/${currentScenario._id}`);
    } else {
      setShowModal(true);
    }
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
      <BackModal
        isOpen={showModal}
        handleClose={() => setShowModal(false)}
        handleDisgard={() => {
          setMonitorChange(false);
        }}
      />
    </>
  );
}
