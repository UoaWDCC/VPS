/**
 * Component displaying groups in a table format
 *
 * @component
 * @example
 * return (
 *   <GroupsTable data={csv_data}>
 *   </GroupsTable>
 * )
 */
import { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

const useStyles = makeStyles({
  root: {
    marginTop: "5vh",
    display: "flex",
    justifyContent: "center",
    overflowX: "auto",
    width: "100vw",
  },
  table: {
    minWidth: "90vw",
  },
  heading: {
    fontWeight: "bold",
    marginBottom: "1rem",
    textAlign: "center",
  },
});

const GroupsTable = ({ data }) => {
  const classes = useStyles();

  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (data) {
      setUsers(data);
    }
  }, [data]);

  return (
    <div className="overflow-x-auto rounded-box border border-base-content/5 w-full">
      <table className="table table-zebra">
        {/* head */}
        <thead>
          <tr>
            <th>Group Number</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {/* row 1 */}
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
