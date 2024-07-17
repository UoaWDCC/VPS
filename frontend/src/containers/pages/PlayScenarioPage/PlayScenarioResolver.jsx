import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { Route, Switch, useHistory, useParams } from "react-router-dom";

import AuthenticationContext from "context/AuthenticationContext";

import DesyncPage from "../DesyncPage";
import InvalidRolePage from "../InvalidRolePage";
import PlayScenarioPage from "./PlayScenarioPage";
import PlayScenarioPageMulti from "./PlayScenarioPageMulti";
import LoadingPage from "../LoadingPage";

const getGroup = async (user, scenarioId) => {
  const token = await user.getIdToken();
  const res = await axios.get(`/api/user/group/${scenarioId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.group;
};

/**
 * This resolver fetches the necessary scenario data and redirects users to the correct page
 */
export default function PlayScenarioResolver() {
  const { user, loading, error: authError } = useContext(AuthenticationContext);
  const { scenarioId } = useParams();
  const history = useHistory();
  const [group, setGroup] = useState(null);

  // TODO: move these somewhere else ?
  if (loading) return <LoadingPage text="Loading Scenario..." />;
  if (authError) return <></>;

  useEffect(() => {
    const resolveType = async () => {
      const fetchedGroup = await getGroup(user, scenarioId);
      if (!fetchedGroup) {
        setGroup("none");
        return history.replace(`/play/${scenarioId}/singleplayer/`);
      }
      setGroup(fetchedGroup);
      return history.replace(`/play/${scenarioId}/multiplayer/`);
    };
    resolveType();
  }, [scenarioId]);

  if (!group) return <LoadingPage text="Loading Scenario..." />;

  return (
    <Switch>
      <Route exact path="/play/:scenarioId/invalid-role">
        <InvalidRolePage group={group} />
      </Route>
      <Route exact path="/play/:scenarioId/desync">
        <DesyncPage />
      </Route>
      <Route path="/play/:scenarioId/multiplayer/:sceneId?">
        <PlayScenarioPageMulti group={group} />
      </Route>
      <Route path="/play/:scenarioId/singleplayer/:sceneId?">
        <PlayScenarioPage />
      </Route>
    </Switch>
  );
}
