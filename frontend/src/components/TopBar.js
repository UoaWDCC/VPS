import React from "react";
import { Link } from "react-router-dom";
import Button from "@material-ui/core/Button";

import styles from "../styling/TopBar.module.scss";

export default function TopBar({ back = "/" }) {
  return (
    <>
      <div className={styles.topBar}>
        <ul className={styles.topBarList}>
          <li className={styles.listItem}>
            <Button
              className="btn top outlined white"
              color="default"
              variant="outlined"
              component={Link}
              to={back}
            >
              Back
            </Button>
          </li>
        </ul>
      </div>
    </>
  );
}
