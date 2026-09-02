import { useQuery } from "@tanstack/react-query";
import { useContext, useEffect } from "react";
import {
  Route,
  Switch,
  useHistory,
  useLocation,
  useParams,
} from "react-router-dom";

import AuthenticationContext from "context/AuthenticationContext";
import { api } from "../../util/api";

import InvalidRolePage from "../status/InvalidRolePage";
import GenericErrorPage from "../status/GenericErrorPage";
import LoadingPage from "../status/LoadingPage";

import PlayScenarioPage from "./PlayScenarioPage";
import PlayLandingPage from "./PlayLandingPage"; // Import the new landing page

const getGroup = async (user, scenarioId) => {
  const res = await api.get(user, `/api/user/group/${scenarioId}`);
  // No group means this scenario is played singleplayer.
  return res.data.group ?? null;
};

/**
 * This resolver fetches the necessary scenario data and redirects users to the correct page
 */
export default function PlayScenarioResolver() {
  const { user, loading, error: authError } = useContext(AuthenticationContext);
  const { scenarioId } = useParams();
  const history = useHistory();
  const location = useLocation();
  // Without a scenarioId we stay on the landing page and never resolve a group.
  const groupQuery = useQuery({
    queryKey: ["userGroup", scenarioId],
    queryFn: () => getGroup(user, scenarioId),
    enabled: Boolean(user && scenarioId),
  });
  const group = groupQuery.data ?? null;

  useEffect(() => {
    if (!scenarioId || !groupQuery.isSuccess) return;
    const mode = group ? "multiplayer" : "singleplayer";
    history.replace(`/play/${scenarioId}/${mode}${location.search}`);
  }, [scenarioId, groupQuery.isSuccess, group]);

  if (loading) return <LoadingPage text="Loading Scenario..." />;
  if (authError) return <></>;
  if (scenarioId && groupQuery.isError) return <GenericErrorPage />;
  if (scenarioId && !groupQuery.isSuccess)
    return <LoadingPage text="Loading Scenario..." />;

  return (
    <Switch>
      {/* Landing page route when no scenarioId is provided */}
      <Route exact path="/play">
        <PlayLandingPage />
      </Route>
      <Route exact path="/play/:scenarioId/error">
        <GenericErrorPage />
      </Route>
      <Route exact path="/play/:scenarioId/invalid-role">
        <InvalidRolePage group={group} />
      </Route>
      <Route path="/play/:scenarioId/multiplayer">
        <PlayScenarioPage group={group} />
      </Route>
      <Route path="/play/:scenarioId/singleplayer">
        <PlayScenarioPage />
      </Route>
    </Switch>
  );
}
