import React, { useState, useContext, useEffect, useMemo } from "react";
import ReactFlow, { Background, MarkerType } from "react-flow-renderer";
import dagre from "dagre";
import { Box } from "@material-ui/core";
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
      x: nodeWithPosition.x,
      y: nodeWithPosition.y,
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

export default function DashboardPage() {
  const { currentScenario } = useContext(ScenarioContext);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [path, setPath] = useState([]);
  const [users, setUsers] = useState([]);

  const { isLoading, graph } = useGraph(currentScenario._id);

  useGet("/api/user", setUsers);

  useEffect(() => {
    console.log(users);
  }, [users]);

  useEffect(() => {
    if (!isLoading) {
      console.log(graph);
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
      setPath([
        "6320417cec05615b4acfa468",
        "632041b8ec05615b4acfa4ac",
        "632041bcec05615b4acfa4e3",
      ]);
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

  const studentTableStyles = { width: "30vw", backgroundColor: "#f3f7f2" };
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
          <h1>Student List</h1>
        </Box>
      </ScreenContainer>
    </ScreenContainer>
  );
}
