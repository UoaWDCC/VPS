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
    <>
      <div className={classes.root}>
        <Paper>
          <Typography variant="h5" component="h1" className={classes.heading}>
            Group Table
          </Typography>
          <TableContainer>
            <Table className={classes.table} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Group Number</TableCell>
                  <TableCell align="right">Name</TableCell>
                  <TableCell align="right">Email</TableCell>
                  <TableCell align="right">Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={user.email || index}>
                    <TableCell component="th" scope="row">
                      {user.group}
                    </TableCell>
                    <TableCell align="right">{user.name}</TableCell>
                    <TableCell align="right">{user.email}</TableCell>
                    <TableCell align="right">{user.role}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </div>
    </>
  );
};

export default GroupsTable;
