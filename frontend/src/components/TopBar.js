import React, { useState } from "react";
import { Link } from "react-router-dom";
import Button from "@material-ui/core/Button";

import styles from "../styling/TopBar.module.scss";
import BackModal from "./BackModal";

export default function TopBar({
  back = "/",
  confirmModal = false,
  children = [],
}) {
  const [showModal, setShowModal] = useState(false);
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
                onClick={() => setShowModal(true)}
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
      <BackModal isOpen={showModal} handleClose={() => setShowModal(false)} />
    </>
  );
}
