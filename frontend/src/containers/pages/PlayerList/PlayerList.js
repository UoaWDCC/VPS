import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useGet } from "../../../hooks/crudHooks";
import PlayerListContainer from "./PlayerListContainer";
import styles from "../../../styling/PlayerList.module.scss";

// CRITICAL NOTE:  MUST ADD ACESSLEVEL RQUIRED STAFF TO app.js

/**
 *  page for displaying the player list
 *
 */
export default function PlayerList() {
  const { scenarioId } = useParams();

  console.log("scenarioId: ", scenarioId);

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
            // console.log(user);
            if (user.scenarioId && user.scenarioId.includes(scenarioId)) {
              return <PlayerListContainer key={user._id} user={user} />;
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
}
