import Button from "@material-ui/core/Button";
import { Link } from "react-router-dom";

import styles from "components/TopBar/TopBar.module.scss";

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
        <ul className={styles.rightTopBarList}>
          <li className={styles.listItem}>{children}</li>
        </ul>
      </div>
    </>
  );
}
