import { useParams } from "react-router-dom";
import { useState, useMemo, useContext, useEffect } from "react";
import { useGet } from "hooks/crudHooks";
import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import SceneContext from "../../context/SceneContext";
import "beautiful-react-diagrams/styles.css";
import DashTopBar from "./components/DashTopBar";
import HelpButton from "../../components/HelpButton";
import { MarkerType, ReactFlowProvider } from "@xyflow/react";
import ScenarioGraph from "./components/Graph";
import DashGroupTable from "./components/DashGroupTable";
import { Skeleton } from "@mui/material";
import StateVarTable from "./components/StateVarTable";
import ScenarioContext from "../../context/ScenarioContext";
/**
 * Might move this logic to it's own file, this way we can render a basic path on the dasboard as well
 * as the viewgroup page.
 */

export default function ViewGroupPage() {
  const { scenarioId, groupId } = useParams();
  const [groupInfo, setGroupInfo] = useState({});
  const [graphLoading, setGraphLoading] = useState(true);
  const { scenes } = useContext(SceneContext);
  const [hasStateVar, setHasStateVar] = useState(false);
  const { stateVariables } = useContext(ScenarioContext);
  useGet(`/api/group/retrieve/${groupId}`, setGroupInfo, true);

  useEffect(() => {
    if (!Array.isArray(stateVariables)) return;
    if (stateVariables.length != 0) setHasStateVar(true);
  }, [stateVariables]);

  const markerEnd = {
    type: MarkerType.ArrowClosed,
    wdith: 15,
    height: 15,
  };
  // console.log(groupInfo)
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

            <DashGroupTable groupInfo={groupInfo} />
            <StateVarTable
              data={groupInfo.stateVariables}
              hasStateVar={hasStateVar}
            />
          </div>
          <div className="w-full">
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
                Array.isArray(edges) && (
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
