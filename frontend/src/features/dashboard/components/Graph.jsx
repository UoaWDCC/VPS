import { useEffect, useState } from "react";
import {
  ReactFlow,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ELK from "elkjs/lib/elk.bundled.js";
import { edgeTypes, nodeTypes } from "./CustomTypes";

export default function ScenarioGraph({
  inNodes,
  inEdges,
  inGPathEdges,
  inSceneMap,
  inGPath,
  onLoaded,
}) {
  /**
   * Adapted ELkjs code
   * Accessed: 10/09/2025
   * https://reactflow.dev/examples/layout/elkjs
   */

  const [direction, setDirection] = useState("DOWN");
  const elk = new ELK();
  const elkOptions = {
    "elk.algorithm": "layered",
    "elk.layered.spacing.nodeNodeBetweenLayers":
      direction === "RIGHT" ? "300" : "200",
    "elk.spacing.nodeNode": "200",
    "elk.direction": direction,
    "org.eclipse.elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
  };

  const { fitView } = useReactFlow();
  const [measured, setMeasured] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [sizes, setSizes] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);

  // Set up initial nodes and update edges with the group path if it exists
  const [newEdges, setNewEdges] = useState([]);
  useEffect(() => {
    if (!inNodes || !inEdges) return;
    setNodes(
      inNodes.map((node) => ({
        ...node,
        position: { x: 0, y: 0 },
      }))
    );
    // console.log("Initial Render")
    setMeasured(false);

    // Only run if there is a group path
    if (!inGPathEdges) return;
    const newEdges = inEdges.map((edge) => {
      const path = inGPathEdges.find((gpath) => gpath.id == edge.id);
      return path ? path : edge;
    });
    setNewEdges(newEdges);
  }, [inNodes, inEdges, inGPathEdges]);

  // Measure the size of nodes
  useEffect(() => {
    if (measured || nodes.length == 0 || !nodes.every((node) => node.measured))
      return;

    const nodeSizes = {};
    nodes.forEach((node) => {
      nodeSizes[node.id] = node.measured;
    });
    // console.log("Nodes have been measured")
    setSizes(nodeSizes);
    setMeasured(true);
  }, [nodes, newEdges]);

  // Finalized render after eveything has been set, the real first render
  useEffect(() => {
    if (Object.keys(sizes).length == 0 && !measured) return;
    RenderGraph();
  }, [sizes, measured]);

  // Update the graph when direction changes
  useEffect(() => {
    if (!measured) return;
    RenderGraph();
  }, [direction]);

  // Update the nodes when a new selection is made
  useEffect(() => {
    handleNodeHighlighting();
  }, [currentIdx, setNodes]);

  function handleNodeHighlighting() {
    if (inGPath.length == 0) return;
    setNodes((tempNodes) =>
      tempNodes.map((node) => {
        if (node.id == inSceneMap[inGPath[currentIdx]]._id) {
          return {
            ...node,
            data: {
              ...node.data,
              isHighlighted: true,
            },
          };
        }
        return {
          ...node,
          data: {
            ...node.data,
            isHighlighted: false,
          },
        };
      })
    );
  }

  const gle = async (nodes, edges, options = {}, tempSizes) => {
    const graph = {
      id: "root",
      layoutOptions: options,
      children: nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
        },
      })),
      edges: edges,
    };
    return elk
      .layout(graph)
      .then((layoutedGraph) => ({
        nodes: layoutedGraph.children.map((node) => ({
          ...node,
          width: tempSizes[node.id].width,
          height: tempSizes[node.id].height,
          position: { x: node.x, y: node.y },
        })),
        edges: layoutedGraph.edges,
      }))
      .catch(console.error);
  };

  function RenderGraph() {
    const opts = { ...elkOptions };
    const ns = inNodes;
    const es = newEdges;
    const tempSizes = sizes;
    gle(ns, es, opts, tempSizes).then(
      ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        fitView();
        onLoaded();
        handleNodeHighlighting();
      }
    );
    // console.log("Updated layout")
  }

  /**
   *  Need to add a Legend to the graph to show what the different colors/edges mean
   *  Need to add a counter to the nodes to show how many times a group has visited that scene
   *  Could make the nodes be grayed out and only show them normally if the group has visited them, makes it easier to visualize progress
   */
  return (
    <div className="h-[700px]">
      <span className="text-sm opacity-80">
        NB: Node positions are not saved if moved around
      </span>
      <ReactFlow
        className={`border`}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        // nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Controls showInteractive={true} className="" />
        <MiniMap />
        <Panel
          position="top-left"
          className="bg-(--color-base-100) p-2 shadow-(--color-base-content-box-shadow)"
        >
          <h3 className="text-lg font-bold font-mono">Legend</h3>
          <div className="flex">
            <div className="pr-3">
              <svg width={30} height={20}>
                <path
                  d="M0 10 H 30 10"
                  style={{ strokeWidth: 3, stroke: "#b1b1b7" }}
                  strokeDasharray="4"
                />
              </svg>
            </div>
            <p>Unvisited Path</p>
          </div>
          <div className="flex">
            <div className="pr-3">
              <svg width={30} height={20}>
                <path
                  d="M0 10 H 30 10"
                  style={{ strokeWidth: 3, stroke: "#89d149" }}
                  strokeDasharray="4"
                />
              </svg>
            </div>
            <p>Visited Path</p>
          </div>
        </Panel>
        <Panel position="top-right" className="flex flex-col gap-2">
          <button
            className="btn btn-sm bg-(--color-base-100) hover:cursor-pointer hover:bg-(--color-primary) border-(--color-base-content)"
            onClick={() => {
              setDirection((prev) => (prev === "DOWN" ? "RIGHT" : "DOWN"));
            }}
          >
            Flip
          </button>
          <button
            className="btn btn-sm bg-(--color-base-100) hover:cursor-pointer hover:bg-(--color-primary) border-(--color-base-content)"
            onClick={() => {
              RenderGraph();
            }}
          >
            Reset Nodes
          </button>
        </Panel>
        <Panel position="center-right">
          {/* <NavigatorTable sceneMap={inSceneMap} groupPath={inGPath}/> */}
          <PathNavigator
            sceneMap={inSceneMap}
            groupPath={inGPath}
            idx={currentIdx}
            setCurrentIdx={setCurrentIdx}
          />
        </Panel>
        <Background />
      </ReactFlow>
    </div>
  );
}

const PathNavigator = ({ sceneMap, groupPath, idx, setCurrentIdx }) => {
  if (groupPath.length == 0) return <></>;
  function updateIndex(d) {
    setCurrentIdx((prev) => {
      const newIdx = prev + d;
      if (newIdx < 0 || newIdx >= groupPath.length) return prev;
      return newIdx;
    });
  }

  return (
    <div>
      <div className="grid justify-items-end">
        <p>Current Node:</p>
        <p className="">{sceneMap[groupPath[idx]].name}</p>
        <div>
          <button
            className="btn bg-(--color-base-100) text-(--color-base-content) mr-2 hover:bg-(--color-primary) border-(--color-base-content)"
            disabled={idx == 0}
            onClick={() => {
              updateIndex(-1);
            }}
          >
            Prev
          </button>
          <button
            className="btn bg-(--color-base-100) text-(--color-base-content) hover:bg-(--color-primary) border-(--color-base-content)"
            disabled={idx + 1 == groupPath.length}
            onClick={() => {
              updateIndex(1);
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
