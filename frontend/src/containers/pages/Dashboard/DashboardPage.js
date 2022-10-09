import React, { useState, useContext, useEffect, useMemo } from "react";
import ReactFlow, { Background, MarkerType } from "react-flow-renderer";
import dagre from "dagre";
import { Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { DataGrid } from "@mui/x-data-grid";
import ScreenContainer from "../../../components/ScreenContainer";
import ScenarioContext from "../../../context/ScenarioContext";
import TopBar from "./TopBar";
import useGraph from "../../../hooks/useGraph";
import SceneNode from "./SceneNode";
import { useGet } from "../../../hooks/crudHooks";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 150;

const getLayoutedElements = (nodes, edges, direction = "TB") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);
  /* eslint-disable no-param-reassign */
  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? "left" : "top";
    node.sourcePosition = isHorizontal ? "right" : "bottom";

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });
  /* eslint-enable no-param-reassign */

  return { nodes, edges };
};

const style = {
  width: "100vw",
  height: "100vh",
};

const columns = [
  { field: "id", headerName: "No.", flex: 1 },
  { field: "user", headerName: "Users who have played", flex: 4 },
];

const useStyles = makeStyles({
  root: {
    "&.MuiDataGrid-root .MuiDataGrid-cell:focus": {
      outline: "none",
    },
    ".MuiDataGrid-cell": {
      cursor: "pointer",
    },
  },
});

export default function DashboardPage() {
  const { currentScenario } = useContext(ScenarioContext);
  const classes = useStyles();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [path, setPath] = useState([]);
  const [users, setUsers] = useState([]);
  const [rows, setRows] = useState([]);
  const { isLoading, graph } = useGraph(currentScenario._id);

  useGet(`api/user/played/${currentScenario._id}`, setUsers);

  useEffect(() => {
    setRows(
      users.map((user, index) => ({
        id: index,
        user: user.name,
        path: user.played.filter(
          (elmt) => elmt.scenarioId === currentScenario._id
        )[0].path,
      }))
    );
  }, [users]);

  useEffect(() => {
    if (!isLoading) {
      const { scenes, adjList } = graph;

      // create nodes from scene data
      const sceneNodes = scenes.map((scene) => {
        return {
          id: scene._id,
          type: "sceneNode",
          data: {
            scenarioId: currentScenario._id,
            sceneId: scene._id,
            sceneTitle: scene.name,
          },
        };
      });

      // create edges from adjacency list
      const sceneEdges = [];

      Object.keys(adjList).forEach((sceneSourceNode) => {
        const tempEdges = adjList[sceneSourceNode].map((sceneTargetNode) => {
          return {
            id: `${sceneSourceNode}-${sceneTargetNode}`,
            type: "smoothstep",
            source: sceneSourceNode,
            target: sceneTargetNode,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          };
        });
        sceneEdges.push(...tempEdges);
      });

      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(sceneNodes, sceneEdges);

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [isLoading]);

  useEffect(() => {
    const animatedEdges = edges.map((edge) => {
      const isAnimated =
        path.indexOf(edge.target) - path.indexOf(edge.source) === 1;
      return {
        ...edge,
        animated: isAnimated,
        style: {
          stroke: isAnimated ? "red" : "",
        },
        zIndex: isAnimated ? 1 : 0,
      };
    });
    setEdges(animatedEdges);
  }, [path]);

  const nodeTypes = useMemo(() => ({ sceneNode: SceneNode }), []);

  const [isHovering, setIsHovering] = useState(false);

  const [scenarioID, setScenarioID] = React.useState("");
  const [sceneID, setsceneID] = React.useState("");
  const [sceneName, setsceneName] = React.useState("");
  const [x, setX] = React.useState("");
  const [y, setY] = React.useState("");

  const userClick = (param) => {
    setPath(param.row.path);
  };

  function handleMouseEnter(event, node) {
    setScenarioID(node.data.scenarioId);
    setsceneID(node.id);
    setsceneName(node.data.sceneTitle);
    setX(event.pageX);
    setY(event.pageY);

    setIsHovering(true);
  }

  React.useEffect(() => {
    document.getElementById("tooltip").style.top = `${y - 100}px`;
    document.getElementById("tooltip").style.left = `${x + 100}px`;
  }, [x, y]);

  function handleMouseLeave() {
    setIsHovering(false);
  }

  const studentTableStyles = { width: "30vw", backgroundColor: "#FFFFFF" };
  return (
    <ScreenContainer vertical>
      <TopBar />
      <ScreenContainer>
        <ReactFlow
          style={style}
          nodes={nodes}
          edges={edges}
          fitView
          nodeTypes={nodeTypes}
          onNodeMouseEnter={(event, node) => {
            handleMouseEnter(event, node);
          }}
          onNodeMouseLeave={(event, node) => handleMouseLeave(node)}
        >
          {isHovering ? (
            <div
              id="tooltip"
              style={{
                color: "red",
                position: "absolute",
                zIndex: "1000",
                backgroundColor: "black",
              }}
            >
              <h2>{scenarioID}</h2>
              <h2>{sceneID}</h2>
              <h2>{sceneName}</h2>
            </div>
          ) : (
            <div id="tooltip" />
          )}
          <Background />
        </ReactFlow>
        <Box sx={studentTableStyles}>
          <DataGrid
            rows={rows}
            columns={columns}
            onCellClick={userClick}
            className={classes.root}
          />
        </Box>
      </ScreenContainer>
    </ScreenContainer>
  );
}
