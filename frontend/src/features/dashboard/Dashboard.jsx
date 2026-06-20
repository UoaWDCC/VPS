import { useGet } from "hooks/crudHooks";
import { useParams, useHistory, useRouteMatch, Switch } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import DashGroupTable from "./components/table/DashGroupTable";
import { ReactFlowProvider } from "@xyflow/react";
import CreateGraphData from "./utils/GraphHelper";
import ScenarioGraph from "./components/ScenarioGraph";
import ProtectedRoute from "../../firebase/ProtectedRoute";
import ViewGroup from "./components/ViewGroup";

/**
 * Could maybe add some info about the scenario? Who created what time, last edited, thumbnail of the scenario and an overlay edit button * which directs you to the edit page?
 *
 * Todo: Need to add some type of message if no groups are assigned
 */

export default function Dashboard() {
  const history = useHistory();
  const { scenarioId } = useParams();
  const { path, url } = useRouteMatch();

  const [scenarioGroupInfo, setScenarioGroupInfo] = useState([]);
  const [scenario, setCurrentScenario] = useState({});
  const [scenes, setScenes] = useState([]);
  const [groupInfo, setGroupInfo] = useState({});
  const [heading, setHeading] = useState("");

  function goBack() {
    history.push("/dashboard");
  }

  // Check what page we are on
  const matchViewGroup = useRouteMatch(`${path}/view-group/:groupId`);
  const isViewGroupMode = Boolean(matchViewGroup);
  const viewGroupId = matchViewGroup?.params.groupId || 0;

  useGet(`api/dashboard/scenarios/${scenarioId}`, setCurrentScenario);

  useGet(`api/dashboard/scenarios/${scenarioId}/scenes`, setScenes);

  const { isLoading } = useGet(
    `/api/dashboard/scenarios/${scenarioId}/groups`,
    setScenarioGroupInfo
  );

  useEffect(() => {
    setHeading(scenario.name);
  }, [scenario]);

  // Fetch group data if in view group mode, skips if not
  useGet(
    `/api/dashboard/groups/${viewGroupId}`,
    setGroupInfo,
    true,
    !isViewGroupMode
  );

  const viewGroup = async (groupId) => {
    history.push(`${url}/view-group/${groupId}`);
  };

  // Resets the current groupInfo when the mode is not the view group mode
  useEffect(() => {
    if (isViewGroupMode) return;
    setGroupInfo({});
  }, [matchViewGroup]);

  // Changes the heading depending on state of page
  useEffect(() => {
    if (!isViewGroupMode) {
      setHeading(scenario.name);
      return;
    }
    if (Object.keys(groupInfo).length == 0) return;
    setHeading(`${groupInfo.users[0].name}`);
  }, [groupInfo]);

  // Create the graph data, also passes if the current group info if it's present
  const { nodes, edges, groupEdges, groupPath, sceneMap } = useMemo(() => {
    return CreateGraphData(scenes, groupInfo ? groupInfo : []);
  }, [scenes, groupInfo]);

  const DashGroupInfo = ({ groupData, className }) => {
    const totalGroups = groupData.length;
    const groupsNotStarted = groupData.filter(
      (group) => group.path.length == 0
    ).length;
    const groupsStarted = groupData.filter(
      (group) => group.path.length != 0
    ).length;

    return (
      <div
        className={`${className} inline-grid lg:stats-vertical xl:stats-horizontal shadow-(--color-base-content-box-shadow) w-full`}
      >
        <div className="stat ">
          <div className="stat-title">Total Groups</div>
          <div className="stat-value">{totalGroups}</div>
          <div className="stat-desc">No. of groups assigned</div>
        </div>
        <div className="stat">
          <div className="stat-title">Not Started</div>
          <div className="stat-value">{groupsNotStarted}</div>
          <div className="stat-desc">No. of groups not started</div>
        </div>
        <div className="stat">
          <div className="stat-title">Started</div>
          <div className="stat-value">{groupsStarted}</div>
          <div className="stat-desc">No. of groups started</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[100vh] w-[100vw]">
      <div className="flex pt-l px-l">
        <button onClick={goBack} className="btn btn-phantom text-m">
          <ArrowLeftIcon size={20} />
          Back
        </button>
      </div>
      <div className="h-full px-10 py-7 overflow-y-scroll ">
        <h1 className="text-xl font-bold">
          {heading ? heading : <span className="invisible">placeholder</span>}
        </h1>
        <div className="flex gap-10">
          {/* Left side coloumn */}
          <div className="w-1/2 min-w-0">
            <Switch>
              <ProtectedRoute exact path={path}>
                <DashGroupInfo
                  className={"lg:stats-horizontal mb-10"}
                  groupData={scenarioGroupInfo}
                />
                <h1 className="text-xl">Groups Table</h1>
                {!isLoading && (
                  <DashGroupTable
                    groupInfo={scenarioGroupInfo}
                    rowClick={viewGroup}
                  />
                )}
              </ProtectedRoute>
              <ProtectedRoute path={`${path}/view-group/:groupId`}>
                <ViewGroup groupInfo={groupInfo} />
              </ProtectedRoute>
            </Switch>
          </div>
          {/* Right side coloum - used for graph */}
          <div className="w-1/2 min-w-0">
            <h3 className="text-3xl font-mona font-bold">Scenario Overview</h3>
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
          </div>
        </div>
      </div>
    </div>
  );
}
