import { useHistory } from "react-router-dom";
import styles from "../../../components/TopBar/TopBar.module.scss";

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
export default function DashTopBar({
  back = "/",
  children = [],
}) {
  const history = useHistory();

  /**
   * Function for changing variables to their appropriate states when the back button is pressed.
   */

  return (
    <>
      <div className={styles.topBar}>
        <ul className={styles.leftTopBarList}>
          <li className={styles.listItem}>(
              <button
                className="btn vps w-[100px]"
                onClick={() => {
                  history.push(back);
                }}
              >
                Back
              </button>
            )
          </li>
        </ul>
        <div className={styles.rightTopBarList}>{children}</div>
      </div>
    </>
  );
}
