import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import { useGet } from "hooks/crudHooks";
import { useParams, useHistory, useRouteMatch, Switch } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import DashTopBar from "./components/DashTopBar";
import HelpButton from "../../components/HelpButton";
import DashGroupTable from "./components/DashGroupTable";
import GroupsIcon from "@mui/icons-material/Groups";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
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
  const { path, url } = useRouteMatch();
  const { scenarioId } = useParams();
  const history = useHistory();
  const [scenarioGroupInfo, setScenarioGroupInfo] = useState([]);
  const [scenario, setCurrentSecnario] = useState({});
  const [scenes, setScenes] = useState([]);
  useGet(`api/scenario/${scenarioId}`, setCurrentSecnario);
  useGet(`api/scenario/${scenarioId}/scene/all`, setScenes);

  const { isLoading } = useGet(
    `/api/group/scenario/${scenarioId}`,
    setScenarioGroupInfo
  );
  // Check what page we are on
  const matchViewGroup = useRouteMatch(`${path}/view-group/:groupId`);
  const backURL = matchViewGroup ? url : "/";
  const isViewGroupMode = Boolean(matchViewGroup);
  const viewGroupId = matchViewGroup?.params.groupId || 0;
  const [groupInfo, setGroupInfo] = useState({});
  const [heading, setHeading] = useState("");
  useEffect(() => {
    setHeading(scenario.name);
  }, [scenario]);
  // Fetch group data if in view group mode, skips if not
  useGet(
    `/api/group/retrieve/${viewGroupId}`,
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
    setHeading(`Group: ${groupInfo.users[0].name}`);
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
          <div className="stat-figure text-info">
            <GroupsIcon />
          </div>
          <div className="stat-title">Total Groups</div>
          <div className="stat-value">{totalGroups}</div>
          <div className="stat-desc">No. of groups assigned</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-warning">
            <HourglassEmptyIcon />
          </div>
          <div className="stat-title">Not Started</div>
          <div className="stat-value">{groupsNotStarted}</div>
          <div className="stat-desc">No. of groups not started</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-success">
            <PlayArrowIcon />
          </div>
          <div className="stat-title">Started</div>
          <div className="stat-value">{groupsStarted}</div>
          <div className="stat-desc">No. of groups started</div>
        </div>
      </div>
    );
  };

  return (
    <ScreenContainer vertical>
      <DashTopBar back={backURL}>
        {/* Need to change the help button to maybe be able to pass something down like have a file of help messages which can be accessed and passed down to be page specific */}
        <HelpButton />
      </DashTopBar>
      <div className="h-full px-10 py-7 overflow-y-scroll ">
        <h1 className="text-3xl font-mona font-bold my-3 flex items-center gap-3">
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
                {!isLoading && (
                  <DashGroupTable
                    groupInfo={scenarioGroupInfo}
                    rowClick={viewGroup}
                  />
                )}
              </ProtectedRoute>
              <ProtectedRoute path={`${path}/view-group/:groupId`}>
                <ViewGroup />
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
    </ScreenContainer>
  );
}
