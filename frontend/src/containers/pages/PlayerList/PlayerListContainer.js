import { dividerClasses } from "@mui/material";
import React from "react";
import styles from "../../../styling/PlayerList.module.scss";

/**
 * container for users in the player list
 *
 * @container
 * @param {object} user - user object
 */
const PlayerListContainer = ({ user = {} }) => {
  const { name, email } = user;
  return (
    <div>
      <div className={styles.Header}>{name}</div>
      <div className={styles.Body}>
        <div className={styles.Text}>
          <ul>
            <b>email: </b> {email}
          </ul>
          <ul>
            <b>Class: </b> placeholder
          </ul>
          {/* Drop down with other aspects of user like played scenarios etc */}
        </div>
      </div>
    </div>
  );
};

export default PlayerListContainer;
