import React from "react";
import { Link } from "react-router-dom";
import Button from "@material-ui/core/Button";

import styles from "../styling/TopBar.module.scss";

export default function TopBar({ back = "/", children = [] }) {
  return (
    <>
      <div className={styles.topBar}>
        <ul className={styles.leftTopBarList}>
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
        <ul className={styles.rightTopBarList}>{children}</ul>
      </div>
    </>
  );
}
