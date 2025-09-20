import { Visibility } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import { Paper, Typography } from "@material-ui/core";

// Need to update this to be able to take either multiple groups or individual group (to display members per row)

const TestTable = ({ groupInfo, rowClick }) => {
  // Check if group info is in array (Scenario Dashboard) or object (Vewiing Group)
  // Maybe just make mode default to groups?
  let mode;
  let group = [];
  if (Array.isArray(groupInfo)) {
    mode = "groups";
    group = groupInfo;
  } else if (groupInfo && groupInfo.users) {
    mode = "members";
    group = [groupInfo];
  }

  const useStyles = makeStyles({
    root: {
      marginTop: "5vh",
      display: "flex",
      justifyContent: "center",
      overflowX: "auto",
      width: "100%",
    },
    heading: {
      fontWeight: "bold",
      marginBottom: "1rem",
      textAlign: "center",
    },
  });

  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Paper>
        <Typography variant="h5" component="h1" className={classes.heading}>
          {mode == "groups" ? "Group Table" : "Group Members"}
        </Typography>
        <TableContainer>
          <Table
            className={`lg:${mode == "groups" ? "min-w-[95vw]" : "min-w-[40vw]"} sm:min-w-[80vw]`}
          >
            <TableHead>
              <TableRow>
                {mode == "groups" ? (
                  <>
                    <TableCell>Group Number/Name</TableCell>
                    <TableCell>Number of members</TableCell>
                    <TableCell>Members - [Role]</TableCell>
                    <TableCell>Started</TableCell>
                    {/* <TableCell>Current Scene</TableCell> */}
                    <TableCell>View Progress</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {mode == "groups"
                ? group.map((ginfo, index) => (
                    <TableRow key={ginfo._id || index}>
                      {/* {console.log(ginfo)} */}
                      <TableCell component="th" scope="row">
                        {ginfo.users[0].group}
                      </TableCell>
                      <TableCell>{ginfo.users.length}</TableCell>
                      <TableCell>
                        {ginfo.users.map((user) => (
                          <div key={user.email}>
                            {user.name} - [{user.role}]
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        {ginfo.path.length != 0 ? "Started" : "Not yet started"}
                      </TableCell>
                      {/* <TableCell></TableCell> */}
                      <TableCell className="flex justify-center items-center">
                        <Visibility
                          className="hover:cursor-pointer"
                          onClick={() => {
                            rowClick(ginfo._id);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                : group[0].users.map((user, index) => (
                    <TableRow key={user.email || index}>
                      <TableCell>
                        <div>{user.name}</div>
                      </TableCell>
                      <TableCell>
                        <div>{user.email}</div>
                      </TableCell>
                      <TableCell>
                        <div>{user.role}</div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
};

export default TestTable;
