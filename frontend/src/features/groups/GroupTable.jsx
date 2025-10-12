import { useEffect, useState } from "react";

const GroupsTable = ({ data }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (data) {
      setUsers(data);
    }
  }, [data]);

  return (
    <div className="overflow-x-auto rounded-box border border-base-content/5 w-full">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Group Number</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, i) => (
            <tr key={i}>
              <th>{user.group}</th>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GroupsTable;
