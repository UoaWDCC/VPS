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
  const { scenarios, currentScenario, setCurrentScenario } =
    useContext(ScenarioContext);
  console.log(currentScenario);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const { isLoading, graph } = useGraph(currentScenario._id);
  useEffect(() => {
    if (!isLoading) {
      console.log(graph.adjList);
      console.log(graph);
    }
  }, [isLoading]);
  const nodeTypes = useMemo(() => ({ sceneNode: SceneNode }), []);

  return (
    <ScreenContainer vertical>
      <TopBar />
      <ReactFlow
        style={style}
        nodes={nodes}
        edges={edges}
        fitView
        nodeTypes={nodeTypes}
      >
        <Background />
      </ReactFlow>
    </ScreenContainer>
  );
}
