import { dividerClasses } from "@mui/material";
import React from "react";
import styles from "../../../styling/PlayerList.module.scss";

const PlayerListContainer = ({ user = {} }) => {
  const { name, email, _id, uid } = user;
  return (
    <div>
      <div className={styles.Header}>{name}</div>
      <div className={styles.Body}>
        <div className={styles.Text}>
          <ul>
            {" "}
            <b>email: </b> {email}
          </ul>
          <ul>
            {" "}
            <b>_id: </b> {_id}
          </ul>
          <ul>
            {" "}
            <b>uid: </b>
            {uid}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PlayerListContainer;
