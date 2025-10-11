import { Visibility } from "@material-ui/icons";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import { Paper, Typography } from "@material-ui/core";
import TableFooter from "@mui/material/TableFooter";
import TablePagination from "@mui/material/TablePagination";
import useStyles from "./TableStyle";
import { useMemo, useState } from "react";
import TablePaginationActions from "./TablePaginationAction";
import TableSortLabel from "@mui/material/TableSortLabel";
import getComparator from "../utils/TableHelper";

// Need to update this to be able to take either multiple groups or individual group (to display members per row)
// Acutally need to update this component to make it reuseable and take in params to dynamically display thead, tdata stuff with num col etc

const DashGroupTable = ({ groupInfo, rowClick }) => {
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

  const classes = useStyles();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const tempLength = mode == "groups" ? group.length : group[0].users.length;
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - tempLength) : 0;
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState(
    mode === "groups" ? "groupNum" : "name"
  );

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  var sort = mode === "groups" ? group : group[0].users;

  const visibleRows = useMemo(
    () =>
      [...sort]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [order, orderBy, page, rowsPerPage]
  );

  return (
    <div className="">
      <Paper className=" border border-(--color-base-content)">
        <Typography variant="h5" component="h1" className={classes.heading}>
          {mode == "groups" ? "Group Table" : "Group Members"}
        </Typography>
        <TableContainer>
          <Table sx={{ tableLayout: "auto" }} stickyHeader>
            <TableHead>
              {mode == "groups" ? (
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "groupNum"}
                      direction={orderBy === "groupNum" ? order : "asc"}
                      onClick={() => handleRequestSort("groupNum")}
                    >
                      Group Number/Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "groupSize"}
                      direction={orderBy === "groupSize" ? order : "asc"}
                      onClick={() => handleRequestSort("groupSize")}
                    >
                      Number of Members
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Members - [Role]</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "groupStarted"}
                      direction={orderBy === "groupStarted" ? order : "asc"}
                      onClick={() => handleRequestSort("groupStarted")}
                    >
                      Started
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>View Progress</TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "name"}
                      direction={orderBy === "name" ? order : "asc"}
                      onClick={() => handleRequestSort("name")}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "email"}
                      direction={orderBy === "email" ? order : "asc"}
                      onClick={() => handleRequestSort("email")}
                    >
                      Email
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === "role"}
                      direction={orderBy === "role" ? order : "asc"}
                      onClick={() => handleRequestSort("role")}
                    >
                      Role
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              )}
            </TableHead>
            <TableBody>
              {mode == "groups"
                ? visibleRows.map((ginfo, index) => (
                    <TableRow key={ginfo._id || index}>
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
                : visibleRows.map((user, index) => (
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
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[
                    5,
                    10,
                    25,
                    { label: "All", value: tempLength },
                  ]}
                  colSpan={mode == "groups" ? 6 : 3}
                  count={tempLength}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  slotProps={{
                    select: {
                      inputProps: {
                        "aria-label": "rows per page",
                      },
                      native: true,
                    },
                  }}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={TablePaginationActions}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
};

export default DashGroupTable;
