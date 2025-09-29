import { useParams } from "react-router-dom";
import { useState, useMemo, useContext } from "react";
import { useGet } from "hooks/crudHooks";
import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import SceneContext from "../../context/SceneContext";
import "beautiful-react-diagrams/styles.css";
import DashTopBar from "./components/DashTopBar";
import HelpButton from "../../components/HelpButton";
import { MarkerType, ReactFlowProvider } from "@xyflow/react";
import ScenarioGraph from "./components/Graph";
import TestTable from "./components/Table";
import { Skeleton } from "@mui/material";

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableFooter from "@mui/material/TableFooter";
import TablePagination from "@mui/material/TablePagination";
import { Paper, Typography } from "@material-ui/core";
import TablePaginationActions from "./components/TablePaginationAction";
import useStyles from "./components/TableStyle";
import TableSortLabel from "@mui/material/TableSortLabel";
import getComparator from "./components/TableHelper";
/**
 * Might move this logic to it's own file, this way we can render a basic path on the dasboard as well
 * as the viewgroup page.
 */

export default function ViewGroupPage() {
  const { scenarioId, groupId } = useParams();
  const [groupInfo, setGroupInfo] = useState({});
  const [graphLoading, setGraphLoading] = useState(true);
  const { scenes } = useContext(SceneContext);
  useGet(`/api/group/retrieve/${groupId}`, setGroupInfo, true);

  const markerEnd = {
    type: MarkerType.ArrowClosed,
    wdith: 15,
    height: 15,
  };

  const { nodes, edges, groupEdges, groupPath, sceneMap } = useMemo(() => {
    var sceneMap = [];
    var groupPath = [];
    const nodes = [];
    const edges = [];
    const groupEdges = [];
    const visitCounter = new Map();
    const edgeCounter = new Map();
    if (Array.isArray(scenes) && scenes.length != 0) {
      // Create a basic map of the scene ID and object
      sceneMap = Object.fromEntries(scenes.map((scene) => [scene._id, scene]));

      // Set and reverse group path then add it to the visited nodes
      if (Array.isArray(groupInfo.path)) {
        groupPath = groupInfo.path.reverse();
        groupPath.forEach((id) => {
          visitCounter.set(id, (visitCounter.get(id) || 0) + 1);
        });
      }
      // Loop through all nodes and create a nodes for ReactFlow
      scenes.forEach((scene) => {
        nodes.push({
          id: scene._id,
          type: "thumbnail",
          position: { x: 0, y: 0 },
          data: {
            label: scene.name,
            components: scene.components,
            visited: visitCounter.get(scene._id) != undefined,
            visitCounter: visitCounter.get(scene._id),
            isHighlighted: false,
          },
        });
      });

      // Loop through each component of a scene and check for the "nextScene" property and add it to edge graph
      scenes.forEach((scene) =>
        scene.components.forEach((obj) => {
          if (obj.nextScene) {
            edges.push({
              id: scene.name + "-" + sceneMap[obj.nextScene].name,
              source: scene._id,
              target: obj.nextScene,
              type: "simpleFloating",
              markerEnd: {
                ...markerEnd,
              },
              style: {
                strokeWidth: 3,
                stroke: "#b1b1b7",
              },
              animated: true,
            });
          }
        })
      );

      /**
       * Loop through group path to create the links of the students path
       * Also count the number of times the edges show up
       */
      for (let i = 0; i < groupPath.length - 1; i++) {
        const id =
          sceneMap[groupPath[i]].name + "-" + sceneMap[groupPath[i + 1]].name;
        edgeCounter.set(id, (edgeCounter.get(id) || 0) + 1);
        groupEdges.push({
          id: id,
          source: groupPath[i],
          target: groupPath[i + 1],
          type: "simpleFloating",
          markerEnd: {
            ...markerEnd,
            color: "#89d149",
          },
          style: {
            strokeWidth: 3,
            stroke: "#89d149",
            zIndex: 10000,
          },
          animated: true,
        });
      }
    }

    // Loop through and update the count of edge
    groupEdges.forEach((edge) => {
      edge.data = { label: edgeCounter.get(edge.id) };
    });

    return { nodes, edges, groupEdges, groupPath, sceneMap };
  }, [scenes, groupInfo]);

  return (
    <ScreenContainer vertical>
      <DashTopBar back={`/dashboard/${scenarioId}`}>
        <HelpButton />
      </DashTopBar>
      {Object.keys(groupInfo) != 0 && (
        <div className="h-full px-10 py-7 pb- overflow-y-scroll lg:flex sm:flex-row">
          <div className="pb-5">
            <h1 className="text-3xl font-mona font-bold my-3">
              Viewing Group {groupInfo.users[0].group}
            </h1>

            <TestTable groupInfo={groupInfo} />
            <StateVarTable data={groupInfo.stateVariables} />
          </div>
          <div className="w-full h-full">
            <h1 className="text-3xl font-mona font-bold px-10 my-3">
              Path Overview
            </h1>
            <div className="relative h-[95%] w-full m-auto px-10">
              {graphLoading && (
                <div className="absolute h-[80%] w-full top-6 left-0 px-10">
                  <Skeleton
                    animation="wave"
                    width="100%"
                    height="100%"
                    variant="rectangular"
                    sx={{ bgcolor: "#f2f2f2" }}
                  />
                </div>
              )}
              {Array.isArray(scenes) &&
                scenes.length != 0 &&
                Array.isArray(nodes) &&
                nodes.length > 0 &&
                Array.isArray(edges) &&
                edges.length > 0 && (
                  <div
                    className={`h-[80%] ${graphLoading ? "opacity-0" : "opacity-100"}`}
                  >
                    <ReactFlowProvider>
                      <ScenarioGraph
                        inNodes={nodes}
                        inEdges={edges}
                        inGPathEdges={groupEdges}
                        inGPath={groupPath}
                        inSceneMap={sceneMap}
                        onLoaded={() => {
                          setGraphLoading(false);
                        }}
                      />
                    </ReactFlowProvider>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </ScreenContainer>
  );
}

const StateVarTable = ({ data }) => {
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
        <Typography variant="h5" component="h1" className={classes.heading}>
          State Variables
        </Typography>
        {children}
      </Paper>
    </div>
  );
  if (data.length == 0) {
    return (
      <PaperContainer>
        <div>
          State variables will show up once the group has scdtarted the
          scenario.
        </div>
      </PaperContainer>
    );
  } else {
    return (
      <PaperContainer>
        <TableContainer>
          <Table>
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
