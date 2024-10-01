import Button from "@material-ui/core/Button";
import ScenarioContext from "../../context/ScenarioContext";
import { Link, useHistory } from "react-router-dom";

import styles from "components/TopBar/TopBar.module.scss";
import { useContext } from "react";

/**
 * Component used for navigation and executing actions located at the top of the screen.
 *
 * @component
 * @example
 * const back = "/"
 * return (
 *   <TopBar back={back} >
 *     { ... }
 *   </TopBar>
 * )
 */
export default function TopBar({ back = "/", children = [] }) {
  const history = useHistory();
  const { currentScenario } = useContext(ScenarioContext);

  return (
    <>
      <div className={styles.topBar}>
        <ul className={styles.leftTopBarList}>
          <li className={styles.listItem}>
            {/* <Button
              className="btn top outlined white"
              color="default"
              variant="outlined"
              component={Link}
              to={back}
            >
              Back
            </Button> */}
            <button
              className="btn btn-primary text-secondary"
              onClick={() => {
                history.push(`/scenario/${currentScenario._id}`);
              }}
            >
              Back
            </button>
          </li>
        </ul>
        <ul className={styles.rightTopBarList}>
          <li className={styles.listItem}>{children}</li>
        </ul>
      </div>
    </>
  );
}
