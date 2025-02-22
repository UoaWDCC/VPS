import ScenarioContext from "../../context/ScenarioContext";
import { useHistory } from "react-router-dom";

import styles from "../../components/TopBar/TopBar.module.scss";
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
export default function TopBar({ children = [] }) {
  const history = useHistory();
  const { currentScenario } = useContext(ScenarioContext);

  return (
    <>
      <div className={styles.topBar}>
        <ul className={styles.leftTopBarList}>
          <li className={styles.listItem}>
            <button
              className="btn vps w-[100px]"
              onClick={() => {
                history.push(`/scenario/${currentScenario._id}`);
              }}
            >
              Back
            </button>
          </li>
        </ul>
        <div className={styles.rightTopBarList}>{children}</div>
      </div>
    </>
  );
}
