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
import { useMemo, useState } from "react";
import TablePaginationActions from "./TablePaginationAction";
import TableSortLabel from "@mui/material/TableSortLabel";
import getComparator from "../../utils/TableHelper";
import CustomSortHeader from "./CustomSortHeader";
import CustomPagination from "./CustomPagination";
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
    <div className="overflow-x-auto rounded-box border border-base-content/5 w-full">
      <table className="table table-zebra table-fixed">
        <thead>
            {mode == "groups" ? (
              <tr>
                <CustomSortHeader
                  active={orderBy === "groupNum"}
                  direction={orderBy === "groupNum" ? order : "asc"}
                  onClick={() => handleRequestSort("groupNum")}
                  >
                    Group Number
                  </CustomSortHeader>
                  <CustomSortHeader
                  active={orderBy === "groupSize"}
                      direction={orderBy === "groupSize" ? order : "asc"}
                      onClick={() => handleRequestSort("groupSize")}
                  >
                    Number of Members
                  </CustomSortHeader>
                  <th>Members - [Role]</th>
                  <CustomSortHeader
                  active={orderBy === "groupStarted"}
                  direction={orderBy === "groupStarted" ? order : "asc"}
                  onClick={() => handleRequestSort("groupStarted")}
                  >
                    Started
                  </CustomSortHeader>
                  <th>View Progress</th>
              </tr>
            ): (
              <tr>
                <CustomSortHeader
                  active={orderBy === "name"}
                  direction={orderBy === "name" ? order : "asc"}
                  onClick={() => handleRequestSort("name")}
                  >
                    Name
                  </CustomSortHeader>
                <CustomSortHeader
                  active={orderBy === "email"}
                  direction={orderBy === "email" ? order : "asc"}
                  onClick={() => handleRequestSort("email")}
                  >
                    Email
                  </CustomSortHeader>
                   <CustomSortHeader
                  active={orderBy === "role"}
                  direction={orderBy === "role" ? order : "asc"}
                  onClick={() => handleRequestSort("role")}
                  >
                    Role
                  </CustomSortHeader>
              </tr>
            )}
        </thead>
        <tbody>
          {mode == "groups"?
            visibleRows.map((ginfo, index) => (
              <tr key={ginfo._id || index}>
                <td>{ginfo.users[0].group}</td>
                <td>{ginfo.users.length}</td>
                <td>{ginfo.users.map((user) => (
                  <span key={user.email}>
                    {user.name} - [{user.role}]
                  </span>
                ))}</td>
                <td>{ginfo.path.length != 0 ? "Started" : "Not yet started"}</td>
                <td><Visibility className="hover:cursor-pointer" onClick={() => {
                  rowClick(ginfo._id)
                }}/></td>
              </tr>
            ))  : visibleRows.map((user, index) => (
              <tr key={user.email || index}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
              </tr>
            )) 
        }
        {/* {emptyRows > 0 && (
          <tr style={{height: 46 * emptyRows}}>
            <td colSpan={mode == "groups" ? 5 : 3}></td>
          </tr>
        )} */}
        </tbody>
        <tfoot>
          <CustomPagination
              colSpan={mode == "groups" ? 5 : 3}
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              count={group.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              actionComponent={TablePaginationActions}
            />
        </tfoot>
      </table>

    </div>
  );
};

export default DashGroupTable;
