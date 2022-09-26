import React, { useState, useContext, useEffect, useMemo } from "react";
import ReactFlow, { Background } from "react-flow-renderer";
import { Button } from "@material-ui/core";
import ScreenContainer from "../../../components/ScreenContainer";
import ScenarioContext from "../../../context/ScenarioContext";
import { usePut } from "../../../hooks/crudHooks";
import AuthenticationContext from "../../../context/AuthenticationContext";
import ListContainer from "../../../components/ListContainer";
import SideBar from "../../../components/SideBar";
import TopBar from "./TopBar";
import useGraph from "../../../hooks/useGraph";
import SceneNode from "./SceneNode";

const initialNodes = [
  {
    id: "1",
    type: "input",
    data: { label: "Input Node" },
    position: { x: 250, y: 25 },
  },

  {
    id: "2",
    // you can also pass a React component as a label
    data: { label: <div>Default Node</div> },
    position: { x: 100, y: 125 },
  },
  {
    id: "3",
    type: "output",
    data: { label: "Output Node" },
    position: { x: 250, y: 250 },
  },
  {
    id: "4",
    type: "sceneNode",
    data: {
      scenarioId: "631ad8c7860f66d328fb185e",
      sceneId: "631ad8c9860f66d328fb1865",
      sceneTitle: "Hello",
    },
    position: { x: 350, y: 250 },
  },
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3", animated: true },
];

const style = {
  width: "100vw",
  height: "100vh",
};

export default function DashboardPage({ data = null }) {
  const { currentScenario } = useContext(ScenarioContext);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const { isLoading, graph } = useGraph(currentScenario._id);

  useEffect(() => {
    if (!isLoading) {
      console.log(graph);
      const { scenes, adjList } = graph;
      const sceneNodes = [];
      scenes.forEach((scene, index) => {
        const sceneNode = {
          id: scene._id,
          type: "sceneNode",
          data: {
            scenarioId: currentScenario._id,
            sceneId: scene._id,
            sceneTitle: scene.name,
          },
          position: { x: 350, y: 250 * index },
        };
        sceneNodes.push(sceneNode);
      });
      setNodes(sceneNodes);
    }
  }, [isLoading]);

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

  function handleMouseLeave(node) {
    setIsHovering(false);
  }

  return (
    <ScreenContainer vertical>
      <TopBar />
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
              "z-index": "-1",
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
    </ScreenContainer>
  );
}
