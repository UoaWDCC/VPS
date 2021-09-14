import React, { useState, useContext } from "react";
import { Link, useHistory } from "react-router-dom";
import Button from "@material-ui/core/Button";

import styles from "../styling/TopBar.module.scss";
import BackModal from "../containers/pages/AuthoringTool/BackModal";
import SceneContext from "../context/SceneContext";
import ScenarioContext from "../context/ScenarioContext";

export default function TopBar({
  back = "/",
  confirmModal = false,
  children = [],
}) {
  const [showModal, setShowModal] = useState(false);
  const { hasChange, setMonitorChange } = useContext(SceneContext);
  const { currentScenario } = useContext(ScenarioContext);
  const history = useHistory();

  function handleLeaveAuthoringTool() {
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
