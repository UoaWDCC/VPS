import React, { useState } from "react";
import { useParams } from "react-router-dom";
import styles from "../../../../../styling/ToolBar.module.scss";
import { useGet } from "../../../../../hooks/crudHooks";
import ChooseBackgroundModal from "./ChooseBackgroundModal";
import PlayerListSubContainer from "./PlayerListSubContainer";

/**
 * This component is the submenu for for background component
 * Beaware that the modal needs to be rendered outside of the MenuItem: https://stackoverflow.com/a/41991884
 * @component
 */
function PlayersListSubMenu() {
  const { scenarioId } = useParams();

  const [users, setUsers] = useState([]);
  const { reFetch } = useGet("/api/user", setUsers);

  // currently just posts all users
  // should be changed to only post users in the scenario
  return (
    <>
      <h2>Players List</h2>

      {users.map((user) => {
        return <PlayerListSubContainer user={user} key={user._id} />;
      })}
    </>
  );
}

export default PlayersListSubMenu;
