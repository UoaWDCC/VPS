import React, { useState } from "react";
import styles from "../../../styling/PlayerList.module.scss";
import { useGet } from "../../../hooks/crudHooks";
import PlayerListContainer from "./PlayerListContainer";

// CRITICAL NOTE:  MUST ADD ACESSLEVEL RQUIRED STAFF TO app.js

/**
 *  page for displaying the player list
 *
 */
export default function PlayerList() {
  const [users, setUsers] = useState([]);
  const { reFetch } = useGet("/api/user", setUsers);

  return (
    <div className={styles.wrapper}>
      <div className={styles.topBar} />
      <div className={styles.content}>
        <h1>Player List</h1>
        <button className={styles.button} type="button" onClick={reFetch}>
          Refresh
        </button>
        <div className={styles.container}>
          {users.map((user) => {
            console.log(user);
            return <PlayerListContainer key={user._id} user={user} />;
          })}
        </div>
      </div>
    </div>
  );
}
