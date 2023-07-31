import React, { useEffect, useState } from "react";
import styles from "../../styling/PlayerList.module.scss";

// import retrieveAllUser from "../../../../backend/src/db/dao/userDao"; no because in backend

// get authorization for access to data?
// get the list of players from the backend
// iterator through users to display them

const user1 = {
  id: 0,
  name: "John Doe",
};
const user2 = {
  id: 1,
  name: "Jane Doe",
};
const user3 = {
  id: 2,
  name: "Bob Doe",
};
// CRITICAL NOTE:  MUST ADD ACESSLEVEL RQUIRED STAFF TO app.js
export default function PlayerList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // request data?
    setUsers([user1, user2, user3]);
  }, []); // empty array means only run once

  return (
    <div className={styles.content}>
      <div className={styles.topBar} />
      <h1>PlayerList</h1>
      {users.map((user) => {
        return <li key={user.id}>{user.name}</li>;
      })}
    </div>
  );
}
