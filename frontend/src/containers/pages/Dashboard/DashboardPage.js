import React, { useState, useContext, useEffect } from "react";
import ReactFlow, { Background } from "react-flow-renderer";
import { Button } from "@material-ui/core";
import ScreenContainer from "../../../components/ScreenContainer";
import ScenarioContext from "../../../context/ScenarioContext";
import { usePut } from "../../../hooks/crudHooks";
import AuthenticationContext from "../../../context/AuthenticationContext";
import ListContainer from "../../../components/ListContainer";
import SideBar from "../../../components/SideBar";
import TopBar from "./TopBar";

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

  return (
    <ScreenContainer vertical>
      <TopBar />
      <ReactFlow style={style} nodes={nodes} edges={edges} fitView>
        <Background />
      </ReactFlow>
    </ScreenContainer>
  );
}
