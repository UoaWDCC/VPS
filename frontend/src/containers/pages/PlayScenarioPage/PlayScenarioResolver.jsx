import { useEffect, useContext, useState } from "react";
import {
  Route,
  Switch,
  useHistory,
  useLocation,
  useParams,
} from "react-router-dom";
import axios from "axios";

import AuthenticationContext from "context/AuthenticationContext";
import useGraph from "hooks/useGraph";

import PlayScenarioPage from "./PlayScenarioPage";
import PlayScenarioPageMulti from "./PlayScenarioPageMulti";

// TODO: move this somewhere else and add error handling
async function get(url, userIdToken) {
  const config = userIdToken && {
    headers: { Authorization: `Bearer ${userIdToken()}` },
  };

  return axios.get(url, config);
}

/**
 * This resolver fetches the necessary scenario data and redirects users to the correct page
 */
export default function PlayScenarioResolver() {
  const { scenarioId } = useParams();
  const location = useLocation();
  const history = useHistory();

  const { graph } = useGraph(scenarioId);
  const { user, getUserIdToken: token } = useContext(AuthenticationContext);
  const [group, setGroup] = useState(null);

  const isMain = location.pathname === `/play/${scenarioId}`;
  const isMulti = location.pathname.includes("multiplayer");

  useEffect(async () => {
    if (!(graph && (isMain || (isMulti && !group)))) return;

    const res = await get(`/api/user/${user.email}/${scenarioId}/group`, token);
    const sceneId = res?.data?.current || graph.getScenes()[0]._id;
    const scenarioPath = res?.data?.group
      ? `${scenarioId}/multiplayer`
      : scenarioId;

    setGroup(res?.data?.group || "none");
    history.replace(`/play/${scenarioPath}/${sceneId}`);
  }, [graph, isMain, isMulti, scenarioId]);

  return (
    <Switch>
      <Route path="/play/:scenarioId/multiplayer/:sceneId">
        <PlayScenarioPageMulti graph={graph} group={group} />
      </Route>
      <Route path="/play/:scenarioId/:sceneId">
        <PlayScenarioPage graph={graph} />
      </Route>
    </Switch>
  );
}
