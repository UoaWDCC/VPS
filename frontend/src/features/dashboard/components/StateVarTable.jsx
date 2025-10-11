import { useState, useMemo } from "react";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableFooter from "@mui/material/TableFooter";
import TablePagination from "@mui/material/TablePagination";
import { Paper, Typography } from "@material-ui/core";
import TablePaginationActions from "./TablePaginationAction";
import useStyles from "./TableStyle";
import TableSortLabel from "@mui/material/TableSortLabel";
import getComparator from "../utils/TableHelper";

const StateVarTable = ({ data, hasStateVar }) => {
  const classes = useStyles();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("name");

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

  const visibleRows = useMemo(
    () =>
      [...data]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [order, orderBy, page, rowsPerPage]
  );

  const PaperContainer = ({ children }) => (
    <div className={classes.root}>
      <Paper>
        <Typography
          variant="h5"
          component="h1"
          className={`${classes.heading}`}
        >
          State Variables
        </Typography>
        {children}
      </Paper>
    </div>
  );

  if (data.length == 0) {
    return (
      <PaperContainer>
        <p className="p-3">
          {hasStateVar
            ? "State variables will show up once the group has started the scenario."
            : "No state variables has been created for this scenario."}
        </p>
      </PaperContainer>
    );
  } else {
    return (
      <PaperContainer>
        <TableContainer className="">
          <Table stickyHeader>
            <TableHead>
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
                    active={orderBy === "type"}
                    direction={orderBy === "type" ? order : "asc"}
                    onClick={() => handleRequestSort("type")}
                  >
                    Type
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "value"}
                    direction={orderBy === "value" ? order : "asc"}
                    onClick={() => handleRequestSort("value")}
                  >
                    Value
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.map((stateVar) => (
                <TableRow key={stateVar.id}>
                  <TableCell>{stateVar.name}</TableCell>
                  <TableCell>{stateVar.type}</TableCell>
                  <TableCell>
                    {stateVar.type === "boolean"
                      ? stateVar.value
                        ? "True"
                        : "False"
                      : stateVar.value}
                  </TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={3} />
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
                    { label: "All", value: data.length },
                  ]}
                  colSpan={3}
                  count={data.length}
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
      </PaperContainer>
    );
  }
};

export default StateVarTable;
