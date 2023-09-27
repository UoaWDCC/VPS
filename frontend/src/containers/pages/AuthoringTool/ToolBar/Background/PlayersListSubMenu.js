import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { MenuItem } from "@material-ui/core";
import styles from "../../../../../styling/ToolBar.module.scss";
import { useGet } from "../../../../../hooks/crudHooks";
import useChooseBackgroundModal from "./useChooseBackgroundModal";
import ChooseBackgroundModal from "./ChooseBackgroundModal";

/**
 * This component is the submenu for for background component
 * Beaware that the modal needs to be rendered outside of the MenuItem: https://stackoverflow.com/a/41991884
 * @component
 */
function PlayersListSubMenu() {
  const { isShowing, hide, show } = useChooseBackgroundModal();

  const { scenarioId } = useParams();

  const [users, setUsers] = useState([]);
  const { reFetch } = useGet("/api/user", setUsers);

  // currently just posts all users
  // should be changed to only post users in the scenario
  return (
    <>
      <MenuItem className={styles.menuItem} onClick={show}>
        <h2>Players List</h2>
      </MenuItem>

      {users.map((user) => {
        console.log(user);

        const { name } = user;

        return (
          <div>
            <div className={styles.Header}>{name}</div>
            <div className={styles.Body}>
              <div className={styles.Text}>
                <ul>
                  <b>User Name:</b> {name}
                </ul>
              </div>
            </div>
          </div>
        );
      })}

      <ChooseBackgroundModal isShowing={isShowing} hide={hide} />
    </>
  );
}

export default PlayersListSubMenu;
