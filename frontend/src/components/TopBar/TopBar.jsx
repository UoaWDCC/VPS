import { useHistory } from "react-router-dom";
import styles from "./TopBar.module.scss";

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
export default function TopBar({ back = "/", preGoBack, children }) {
  const history = useHistory();

  function goBack() {
    if (preGoBack) preGoBack();
    history.push(back);
  }

  return (
    <>
      <div className={styles.topBar}>
        <ul className={styles.leftTopBarList}>
          <li className={styles.listItem}>
            <button className="btn vps w-[100px]" onClick={goBack}>
              Back
            </button>
          </li>
        </ul>
        <div className={styles.rightTopBarList}>{children}</div>
      </div>
    </>
  );
}
