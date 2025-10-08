import { useParams } from "react-router-dom";
import { useState, useMemo, useContext, useEffect } from "react";
import { useGet } from "hooks/crudHooks";
import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import SceneContext from "../../context/SceneContext";
import "beautiful-react-diagrams/styles.css";
import DashTopBar from "./components/DashTopBar";
import HelpButton from "../../components/HelpButton";
import { MarkerType, ReactFlowProvider } from "@xyflow/react";
import ScenarioGraph from "./components/ScenarioGraph";
import DashGroupTable from "./components/DashGroupTable";
import { Skeleton } from "@mui/material";
import StateVarTable from "./components/StateVarTable";
import ScenarioContext from "../../context/ScenarioContext";
import CreateGraphData from "./components/GraphHelper";
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

  // console.log(groupInfo)
  const { nodes, edges, groupEdges, groupPath, sceneMap } = useMemo(() => {
    return CreateGraphData(scenes, groupInfo);
  }, [scenes, groupInfo]);

  return (
    <ScreenContainer vertical>
      <DashTopBar back={`/dashboard/${scenarioId}`}>
        <HelpButton />
      </DashTopBar>
      {Object.keys(groupInfo) != 0 && (
        <div className="h-full px-10 py-7 overflow-y-scroll">
            <h1 className="text-3xl font-mona font-bold my-3">
              Viewing Group {groupInfo.users[0].group}
            </h1>
            <div className=" lg:flex sm:flex-row gap-10">
          <div className="w-[50%]">
            <DashGroupTable groupInfo={groupInfo} />
            <StateVarTable
              data={groupInfo.stateVariables}
              hasStateVar={hasStateVar}
            />
          </div>
          <div className="w-[50%]">
            <h1 className="text-3xl font-mona font-bold">
              Path Overview
            </h1>
            <div className="relative h-[95%] w-full">
              {Array.isArray(scenes) &&
                scenes.length != 0 &&
                Array.isArray(nodes) &&
                nodes.length > 0 &&
                Array.isArray(edges) && (
                    <ReactFlowProvider>
                      <ScenarioGraph
                        inNodes={nodes}
                        inEdges={edges}
                        inGPathEdges={groupEdges}
                        inGPath={groupPath}
                        inSceneMap={sceneMap}
                        className="h-[700px]"
                      />
                    </ReactFlowProvider>
           
)}
            </div>
          </div>
            </div>
        </div>
      )}
    </ScreenContainer>
  );
}
