import {
  useParams,
  useHistory,
  useLocation,
  useRouteMatch,
  Switch,
} from "react-router-dom";
import { useContext, useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../util/api";
import DashGroupTable from "./components/table/DashGroupTable";
import { ReactFlowProvider } from "@xyflow/react";
import CreateGraphData from "./utils/GraphHelper";
import ScenarioGraph from "./components/ScenarioGraph";
import ProtectedRoute from "../../firebase/ProtectedRoute";
import ViewGroup from "./components/ViewGroup";
import ManageGroupsPage from "../groups/ManageGroupsPage";
import AuthenticationContext from "../../context/AuthenticationContext";
import { ArrowLeftIcon, SearchIcon, UsersIcon } from "lucide-react";

/**
 * Could maybe add some info about the scenario? Who created what time, last edited, thumbnail of the scenario and an overlay edit button * which directs you to the edit page?
 *
 * Todo: Need to add some type of message if no groups are assigned
 */

const EMPTY_OBJECT = {};
const EMPTY_ARRAY = [];

async function fetchDashboard(user, url) {
  const res = await api.get(user, url);
  return res.data;
}

export default function Dashboard() {
  const history = useHistory();
  const location = useLocation();
  const { scenarioId } = useParams();
  const { path, url } = useRouteMatch();
  const cameFromCanvas =
    new URLSearchParams(location.search).get("from") === "canvas";

  const [groupInfo, setGroupInfo] = useState({});
  const [heading, setHeading] = useState("");
  const [activeTab, setActiveTab] = useState("groups");
  const [memberSearch, setMemberSearch] = useState("");
  const { user } = useContext(AuthenticationContext);

  // Check what page we are on
  const matchViewGroup = useRouteMatch(`${path}/view-group/:groupId`);
  const isViewGroupMode = Boolean(matchViewGroup);
  const viewGroupId = matchViewGroup?.params.groupId || 0;

  // From the group list, back goes home (or the canvas, if that's where we
  // came from); from a group's page, back goes to the group list
  function goBack() {
    if (isViewGroupMode) {
      history.push(`${url}${location.search}`);
      return;
    }
    history.push(cameFromCanvas ? `/scenario/${scenarioId}` : "/dashboard");
  }

  const scenarioQuery = useQuery({
    queryKey: ["dashboard", "scenario", scenarioId],
    queryFn: () =>
      fetchDashboard(user, `api/dashboard/scenarios/${scenarioId}`),
    enabled: Boolean(user && scenarioId),
  });
  const scenario = scenarioQuery.data ?? EMPTY_OBJECT;

  const scenesQuery = useQuery({
    queryKey: ["dashboard", "scenes", scenarioId],
    queryFn: () =>
      fetchDashboard(user, `api/dashboard/scenarios/${scenarioId}/scenes`),
    enabled: Boolean(user && scenarioId),
  });
  const scenes = scenesQuery.data ?? EMPTY_ARRAY;

  const groupsQuery = useQuery({
    queryKey: ["dashboard", "groups", scenarioId],
    queryFn: () =>
      fetchDashboard(user, `/api/dashboard/scenarios/${scenarioId}/groups`),
    enabled: Boolean(user && scenarioId),
  });
  const scenarioGroupInfo = groupsQuery.data ?? EMPTY_ARRAY;
  const isOwner = Boolean(user && scenario.uid && user.uid === scenario.uid);
  const isLoading = groupsQuery.isPending;
  const reFetchGroups = groupsQuery.refetch;

  useEffect(() => {
    setHeading(scenario.name);
  }, [scenario.name]);

  // Fetch group data if in view group mode, skips if not
  const viewGroupQuery = useQuery({
    queryKey: ["dashboard", "group", viewGroupId],
    queryFn: () => fetchDashboard(user, `/api/dashboard/groups/${viewGroupId}`),
    enabled: Boolean(user && isViewGroupMode),
  });

  useEffect(() => {
    if (viewGroupQuery.data) setGroupInfo(viewGroupQuery.data);
  }, [viewGroupQuery.data]);

  const viewGroup = async (groupId) => {
    history.push(`${url}/view-group/${groupId}${location.search}`);
  };

  // Jumps to the Members tab, filtered down to just this member's group
  const handleMemberClick = (member) => {
    setActiveTab("members");
    setMemberSearch(member.group != null ? String(member.group) : "");
  };

  const handleRevoke = async (member) => {
    if (!window.confirm(`Remove ${member.name} from their group?`)) return;
    try {
      await api.patch(
        user,
        `/api/dashboard/scenarios/${scenarioId}/groups/${member.groupId}/revoke`,
        { uid: user.uid, email: member.email }
      );
      reFetchGroups();
    } catch (err) {
      console.error("Failed to revoke member:", err);
      toast.error("Failed to revoke member from their group");
    }
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

  // Flattens every group's members into a single list for the Members tab
  const allMembers = useMemo(
    () => ({
      users: scenarioGroupInfo.flatMap((group) =>
        group.users.map((member) => ({ ...member, groupId: group._id }))
      ),
    }),
    [scenarioGroupInfo]
  );

  // Filters the Members tab list by name, email, or an exact group match
  // (an exact group match lets clicking a member in the Groups tab jump
  // here pre-filtered to just their group, without name/email substrings
  // that happen to equal the group value causing unrelated false matches)
  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    if (!query) return allMembers;
    return {
      users: allMembers.users.filter(
        (user) =>
          String(user.group).toLowerCase() === query ||
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
      ),
    };
  }, [allMembers, memberSearch]);

  const DashGroupInfo = ({ groupData, className }) => {
    const totalGroups = groupData.length;
    const groupsStarted = groupData.filter(
      (group) => group.path.length != 0
    ).length;
    const groupsNotStarted = groupData.filter(
      (group) => group.path.length == 0
    ).length;

    const stats = [
      {
        label: "Total Groups",
        value: totalGroups,
        desc: "No. of groups assigned",
      },
      {
        label: "Has Started",
        value: groupsStarted,
        desc: "No. of groups that have started",
      },
      {
        label: "Not Started",
        value: groupsNotStarted,
        desc: "No. of groups not yet started",
      },
    ];

    return (
      <div
        className={`${className} flex divide-x divide-base-content/15 rounded-box border border-base-content/15 bg-base-200 w-full`}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex-1 flex flex-col gap-1 px-6 py-5"
          >
            <span className="font-semibold">{stat.label}</span>
            <span className="text-3xl font-bold">{stat.value}</span>
            <span className="text-sm text-base-content/60">{stat.desc}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Switch>
      <ProtectedRoute path={`${path}/manage-groups`}>
        <ManageGroupsPage onUpload={reFetchGroups} />
      </ProtectedRoute>
      <ProtectedRoute path={path}>
        <div className="flex flex-col h-[100vh] w-[100vw]">
          <div className="flex pt-l px-l">
            <button onClick={goBack} className="btn btn-phantom text-m">
              <ArrowLeftIcon size={20} />
              Back
            </button>
            {!isViewGroupMode && (
              <button
                onClick={() =>
                  history.push(`${url}/manage-groups${location.search}`)
                }
                className="btn btn-phantom text-m ml-auto"
              >
                <UsersIcon size={20} />
                Assign Players
              </button>
            )}
          </div>
          <div className="h-full px-10 py-7 overflow-y-scroll ">
            <h1 className="text-3xl font-ibm font-bold">
              {heading ? (
                heading
              ) : (
                <span className="invisible">placeholder</span>
              )}
            </h1>
            <div className="flex gap-10">
              {/* Left side coloumn */}
              <div className="w-1/2 min-w-0">
                <Switch>
                  <ProtectedRoute exact path={path}>
                    <DashGroupInfo
                      className={"mb-10"}
                      groupData={scenarioGroupInfo}
                    />
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold">
                        {activeTab === "groups" ? "Groups" : "Members"}
                      </h2>
                      <div className="join">
                        <button
                          className={`btn btn-ghost join-item ${activeTab === "groups" ? "text-base-content" : "text-base-content/60 hover:bg-primary/10 hover:text-primary"}`}
                          onClick={() => setActiveTab("groups")}
                        >
                          Groups
                        </button>
                        <button
                          className={`btn btn-ghost join-item ${activeTab === "members" ? "text-base-content" : "text-base-content/60 hover:bg-primary/10 hover:text-primary"}`}
                          onClick={() => setActiveTab("members")}
                        >
                          Members
                        </button>
                      </div>
                    </div>
                    {activeTab === "members" && (
                      <label className="input search w-full mb-4">
                        <input
                          type="search"
                          placeholder="Search members by name, email, or group"
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                        />
                        <SearchIcon size={18} />
                      </label>
                    )}
                    {!isLoading &&
                      (activeTab === "groups" ? (
                        <DashGroupTable
                          key="groups"
                          groupInfo={scenarioGroupInfo}
                          rowClick={viewGroup}
                          onMemberClick={handleMemberClick}
                        />
                      ) : (
                        <DashGroupTable
                          key="members"
                          groupInfo={filteredMembers}
                          onRevoke={isOwner ? handleRevoke : undefined}
                        />
                      ))}
                  </ProtectedRoute>
                  <ProtectedRoute path={`${path}/view-group/:groupId`}>
                    <ViewGroup groupInfo={groupInfo} />
                  </ProtectedRoute>
                </Switch>
              </div>
              {/* Right side coloum - used for graph */}
              <div className="w-1/2 min-w-0">
                <h3 className="text-3xl font-ibm font-bold">
                  Scenario Overview
                </h3>
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
      </ProtectedRoute>
    </Switch>
  );
}
