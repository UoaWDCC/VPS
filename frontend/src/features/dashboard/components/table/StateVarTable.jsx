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
import useStyles from "../TableStyle";
import TableSortLabel from "@mui/material/TableSortLabel";
import getComparator from "../../utils/TableHelper";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import LastPageIcon from "@mui/icons-material/LastPage";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CustomSortHeader from "./CustomSortHeader";
import CustomPagination from "./CustomPagination";
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

  if (data.length == 0) {
    return (
        <p >
          {hasStateVar
            ? "State variables will show up once the group has started the scenario."
            : "No state variables has been created for this scenario."}
        </p>
    );
  } else {
    return (
      <div className="overflow-x-auto rounded-box border border-base-content/5 w-full">
        <table className="table table-zebra table-fixed">
          <thead>
            <tr>
              <CustomSortHeader
              active={orderBy === "name"}
              direction={orderBy === "name" ? order : "asc"}
              onClick={() => handleRequestSort("name")}
             >
              Name
             </CustomSortHeader>
             <CustomSortHeader
              active={orderBy === "type"}
              direction={orderBy === "type" ? order : "asc"}
              onClick={() => handleRequestSort("type")}
             >
              Type
             </CustomSortHeader>
              <CustomSortHeader
              active={orderBy === "value"}
              direction={orderBy === "value" ? order : "asc"}
              onClick={() => handleRequestSort("value")}
             >
              Value
             </CustomSortHeader>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((stateVar) => (
              <tr key={stateVar.id}>
                <td>{stateVar.name}</td>
                <td>{stateVar.type}</td>
                <td>{stateVar.type === "boolean" ? stateVar.value ? "True" : "False": stateVar.value}</td>
              </tr>
            ))}
            {emptyRows > 0 && (
              <tr style={{height: 46 * emptyRows}}>
                <td colSpan={3}></td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <CustomPagination
              colSpan={3}
              value={rowsPerPage}
              onChange={handleChangeRowsPerPage}
              count={data.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              actionComponent={TablePaginationActions}
            />
            
          </tfoot>
        </table>
      </div>
    );
  }
};

export default StateVarTable;
