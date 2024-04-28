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

export default function GroupTable({ data }) {
  const classes = useStyles();

  return (
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
                <TableCell align="right">Nurse</TableCell>
                <TableCell align="right">Doctor</TableCell>
                <TableCell align="right">Pharmacist</TableCell>
                <TableCell align="right">Progress</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((group) => (
                <TableRow key={group.groupNumber}>
                  <TableCell component="th" scope="row">
                    {group.groupNumber}
                  </TableCell>
                  <TableCell align="right">{group.nurse}</TableCell>
                  <TableCell align="right">{group.doctor}</TableCell>
                  <TableCell align="right">{group.pharmacist}</TableCell>
                  <TableCell align="right">{group.progress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
}
