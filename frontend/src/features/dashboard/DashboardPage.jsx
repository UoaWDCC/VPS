import { Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { DataGrid } from "@mui/x-data-grid";
import dagre from "dagre";
import React, { useContext, useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, MarkerType } from "react-flow-renderer";
import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import ScenarioContext from "../../context/ScenarioContext";
import { useGet } from "../../hooks/crudHooks";
import SceneNode from "./SceneNode";
import TopBar from "./TopBar";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 150;

const getLayoutedElements = (nodes, edges, direction = "TB") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });
  nodes.forEach((node) => {
    console.log(node);
    console.log(node.visited);
    console.log(node.id);
    console.log(node.data);
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

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

  return { nodes, edges };
};

const style = {
  width: "100vw",
  height: "100vh",
};

const columns = [
  { field: "id", headerName: "No.", flex: 1 },
  { field: "user", headerName: "Users", flex: 3 },
  { field: "numAttempts", headerName: "Attempts", flex: 2 },
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
      users.map((user, index) => {
        const playedPaths = user.played.filter(
          (elmt) => elmt.scenarioId === currentScenario._id
        );
        return {
          id: index,
          user: user.name,
          path: playedPaths[playedPaths.length - 1].path,
          numAttempts: playedPaths.length,
        };
      })
    );
    console.log(users);
  }, [users]);

  // const idVisitedMap = { id: "awdawdawdawdawd" };
  const [idVisitedMap, setIdVisitedMap] = React.useState({});

  useEffect(() => {
    if (!isLoading) {
      const { scenes, adjList } = graph;

      // create nodes from scene data
      const sceneNodes = scenes.map((scene) => {
        const temp = idVisitedMap;
        temp[scene._id] = [scene.visited, scene.name];
        setIdVisitedMap(temp);
        return {
          id: scene._id,
          type: "sceneNode",
          data: {
            scenarioId: currentScenario._id,
            sceneId: scene._id,
            sceneTitle: scene.name,
            visited: scene.visited,
            components: scene.components,
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

  const [sceneName, setsceneName] = React.useState("");
  const [next, setNext] = React.useState("");
  const [sceneVisited, setsceneVisited] = React.useState(0);
  const [x, setX] = React.useState("");
  const [y, setY] = React.useState("");

  const userClick = (param) => {
    setPath(param.row.path);
  };

  const renderNodeInformation = (node) => {
    const nextVisited = node.data.components
      .filter(
        (c) =>
          c.type === "BUTTON" && c.nextScene !== "" && node.data.visited !== 0
      )
      .map((c) => {
        let percent =
          parseInt(idVisitedMap[c.nextScene][0], 10) /
          parseInt(node.data.visited, 10);

        if (percent > 1) {
          percent = 1;
        }

        return (
          <p>
            {idVisitedMap[c.nextScene][1]} {percent * 100}%
          </p>
        );
      });

    if (nextVisited.length === 0) {
      return <p>No children scenes visited.</p>;
    }

    return nextVisited;
  };

  function handleMouseEnter(event, node) {
    setsceneName(node.data.sceneTitle);
    setsceneVisited(node.data.visited);
    setX(event.pageX);
    setY(event.pageY);

    setIsHovering(true);

    setNext(renderNodeInformation(node));
  }

  React.useEffect(() => {
    document.getElementById("tooltip").style.top = `${y - 75}px`;
    document.getElementById("tooltip").style.left = `${x + 25}px`;
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
                color: "black",
                position: "absolute",
                zIndex: "1000",
                backgroundColor: "lightgrey",
                padding: "0px",
                paddingLeft: "16px",
                paddingRight: "16px",
                borderRadius: "4px",
                minWidth: "200px",
                maxWidth: "fit-content",
              }}
            >
              <h4>Scene Name: {sceneName}</h4>
              <h4>Students Visited: {sceneVisited}</h4>
              <h4>Next Scenes:</h4>
              {next}
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
