import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import { useGet } from "hooks/crudHooks";
import { useParams, useHistory, useRouteMatch, Switch } from "react-router-dom";
import { useEffect, useState, useMemo, useContext } from "react";
import DashTopBar from "./components/DashTopBar";
import HelpButton from "../../components/HelpButton";
import DashGroupTable from "./components/table/DashGroupTable";
import GroupsIcon from "@mui/icons-material/Groups";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { ReactFlowProvider } from "@xyflow/react";
import CreateGraphData from "./utils/GraphHelper";
import ScenarioGraph from "./components/ScenarioGraph";
import ProtectedRoute from "../../firebase/ProtectedRoute";
import ViewGroup from "./components/ViewGroup";
import LoadingPage from "../status/LoadingPage";
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
  const [scenario, setCurrentScenario] = useState({});
  const [scenes, setScenes] = useState([]);
  const [accessList, setAccessList] = useState(null);
  const [accessInfo, setAccessInfo] = useState(null)
  const [allowed, setAllowed] = useState(false);

  const {isLoading: accessLoading, error: accessError, res: accessRes} = useGet(`api/dashboard/scenarios/${scenarioId}/access`, setAccessInfo);
  console.log(accessRes)
  useEffect(() => {
    if(accessLoading || !accessRes) return;
    // Middleware deny

    if(accessRes.status == 401 ){
      setAllowed(false);
      history.replace("/", {toast: {message: "Access denied. If you believe this is an error, please contact the author of the scenario.", type:"error", options:{duration: 6000}}})
      return;
    }

    /**
     * In practice this error should not occur as it's the middleware is currently running checks against an access list
     * which would be created alongside when new scenarios are created. This error currently is in place due to an access list not existsing but will implement a check in the dashboard middleware to check for ownership against the scenario it self and not search for the access list to make it more robust and support legacy scenarios. Ideally, once this is implemented the dashboard page when there is no access list found, the author would be able to access it and it should have a button for them to create an access list, this would then allow them to add extra users for dashboard.
     */
    if(accessRes.status == 404){
      setAllowed(false);
      history.replace("/", {toast: {message: "Access List not found. Stupid error will be fixed", type:"error", options:{duration: 6000}}})
      return;
    }

    if(accessInfo.allowed)
    {
      setAllowed(true);
    }
    
  }, [accessLoading, accessError, accessInfo, accessRes])

  useGet(`api/access/users/${scenarioId}`, setAccessList, true, !allowed);
  useGet(`api/dashboard/scenarios/${scenarioId}`, setCurrentScenario, true, !allowed);
  useGet(`api/dashboard/scenarios/${scenarioId}/scenes`, setScenes, true, !allowed);
  // console.log(scenario)
  // useGet(`api/access/dashboard/${scenarioId}`, setAccessList);
  const { isLoading } = useGet(
    `/api/dashboard/scenarios/${scenarioId}/groups`,
    setScenarioGroupInfo, true, !allowed
  );
  // console.log(accessList)
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
    `/api/dashboard/groups/${viewGroupId}`,
    setGroupInfo,
    true,
    !isViewGroupMode || !allowed
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

  // Cheap way to block the user from seeing the dashboard page before permissions are fully checked.
  // Could be a better way?
 if (allowed == false) return <LoadingPage text="Checking permissions..." />;
  return (
    <ScreenContainer vertical>
      <DashTopBar back={backURL}>
        {/* Need to change the help button to maybe be able to pass something down like have a file of help messages which can be accessed and passed down to be page specific */}
        <HelpButton />
      </DashTopBar>
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
                <ViewGroup groupInfo={groupInfo}/>
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
