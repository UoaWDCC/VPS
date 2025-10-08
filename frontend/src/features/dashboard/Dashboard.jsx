import ScreenContainer from "../../components/ScreenContainer/ScreenContainer";
import { useGet } from "hooks/crudHooks";
import { useParams, useHistory } from "react-router-dom";
import { useState, useContext, useMemo } from "react";
import ScenarioContext from "../../context/ScenarioContext";
import DashTopBar from "./components/DashTopBar";
import HelpButton from "../../components/HelpButton";
import DashGroupTable from "./components/DashGroupTable";
import GroupsIcon from "@mui/icons-material/Groups";
import BlockIcon from "@mui/icons-material/Block";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import SceneContext from "../../context/SceneContext";
import { ReactFlowProvider } from "@xyflow/react";
import CreateGraphData from "./components/GraphHelper";
import ScenarioGraph from "./components/ScenarioGraph";
import GraphWrapper from "./components/GraphWrapper";
/**
 * Could maybe add some info about the scenario? Who created what time, last edited, thumbnail of the scenario and an overlay edit button * which directs you to the edit page?
 *
 * Todo: Need to add some type of message if no groups are assigned
 */

export default function Dashboard() {
  const { scenarioId } = useParams();
  const history = useHistory();
  const [scenarioGroupInfo, setScenarioGroupInfo] = useState([]);
  const { currentScenario } = useContext(ScenarioContext);
  const { scenes } = useContext(SceneContext);
  const [graphLoading, setGraphLoading] = useState(true);
  const { isLoading } = useGet(
    `/api/group/scenario/${scenarioId}`,
    setScenarioGroupInfo
  );
  console.log(scenarioGroupInfo)
  const viewGroup = async (groupId) => {
    history.push(`/dashboard/${scenarioId}/view-group/${groupId}`);
  };

  const { nodes, edges, groupEdges, groupPath, sceneMap } = useMemo(() => {
    return CreateGraphData(scenes, []);
  }, [scenes]);

  const DashGroupInfo = ({ groupData, className }) => {
    const totalGroups = groupData.length;
    const groupsNotStarted = groupData.filter(
      (group) => group.path.length == 0
    ).length;
    const groupsStarted = groupData.filter(
      (group) => group.path.length != 0
    ).length;
    // Placeholder here, needs an update for when the group completes a scenario it sets a var in the database, probs alr exist but will implement this later
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
  /**
   * Is it better to just show a loading screen instead of conditionally rendering the content to stop it
   * flashing?
   *
   * Todo: Add a button to the edit page and manage groups thingy :D
   */
  return (
      <ScreenContainer vertical>
        <DashTopBar>
          {/* Need to change the help button to maybe be able to pass something down like have a file of help messages which can be accessed and passed down to be page specific */}
          <HelpButton />
        </DashTopBar>
          <div className="h-full px-10 py-7 overflow-y-scroll ">
            <h1 className="text-3xl font-mona font-bold my-3 flex items-center gap-3">
              {scenarioGroupInfo.length == 0
                ? `No groups assgined for ${currentScenario.name}`
                : `Viewing group${scenarioGroupInfo.length == 1 ? "" : "s"} for ${currentScenario.name}`}
            </h1>
            <div className="flex gap-10">
              <div className="w-[50%]">
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
              </div>
              <div className="w-[50%]">
                <h1 className="text-3xl font-mona font-bold">Scenario Overview</h1>
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
                      className="h-[700px]"
                  />
                </ReactFlowProvider>
              </div>
            </div>
          </div>

      </ScreenContainer>
  );
}
