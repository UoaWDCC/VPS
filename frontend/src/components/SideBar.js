import React, { useContext } from "react";
import { Link } from "react-router-dom";
import Button from "@material-ui/core/Button";
import ScenarioContext from "../context/ScenarioContext";

import styles from "../styling/SideBar.module.scss";

export default function SideBar() {
  const { scenario } = useContext(ScenarioContext);
  return (
    <>
      <div className={styles.sideBar}>
        <img
          className={styles.logo}
          src="uoa-med-and-health-sci-logo.png"
          alt="UoA Medical & Health Science Logo"
        />
        <ul className={styles.sideBarList}>
          <li>
            <Button
              className="btn side contained white"
              color="default"
              variant="contained"
              component={Link}
              to="/scenario/changeThisToDynamicScenarioId"
            >
              Create
            </Button>
          </li>
          <li className={styles.listItem}>
            <Button
              className="btn side contained white"
              color="default"
              variant="contained"
              component={Link}
              to={scenario ? `/scenario/${scenario.id}` : ""}
            >
              Edit
            </Button>
          </li>
        </ul>
      </div>
    </>
  );
}
