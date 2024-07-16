import { useContext, useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import AuthenticationContext from "context/AuthenticationContext";
import axios from "axios";
import LoadingPage from "../LoadingPage";
// import ScenarioPreloader from "./Components/ScenarioPreloader";
import PlayScenarioCanvas from "./PlayScenarioCanvas";
import useStyles from "./playScenarioPage.styles";

const sceneCache = new Map();

// returns the scene id that we should switch to
const navigate = async (user, scenarioId, currentScene, nextScene) => {
  const token = await user.getIdToken();
  const config = {
    method: "post",
    url: `http://localhost:5000/api/navigate/user/${scenarioId}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: { currentScene, nextScene },
  };
  const res = await axios.request(config);
  res.data.scenes.forEach((scene) => sceneCache.set(scene._id, scene));
  return res.data.active;
};

/**
 * This page allows users to play a scenario.
 *
 * @container
 */
export default function PlayScenarioPage() {
  const { user, loading, error: authError } = useContext(AuthenticationContext);

  const { scenarioId, sceneId } = useParams();
  const history = useHistory();
  const styles = useStyles();

  const [previous, setPrevious] = useState(null);
  const [error, setError] = useState(null);

  // TODO: move these somewhere else ?
  if (loading) return <LoadingPage text="Loading Scene..." />;
  if (authError) return <></>;

  useEffect(async () => {
    const res = await navigate(user, scenarioId, previous, sceneId).catch((e) =>
      setError(e?.response)
    );
    if (!sceneId) history.replace(`/play/${scenarioId}/singleplayer/${res}`);
  }, [sceneId]);

  if (error) {
    if (error.status === 409) {
      history.push(`/play/${scenarioId}/desync`);
    } else if (error.status === 403) {
      history.push(`/play/${scenarioId}/invalid-role`);
    }
    // TODO: create a generic error page and redirect to it
    return <></>;
  }

  const currScene = sceneCache.get(sceneId);
  if (!currScene) return <LoadingPage text="Loading Scene..." />;

  console.log(currScene);

  const incrementor = (id) => {
    setPrevious(sceneId);
    history.push(`/play/${scenarioId}/singleplayer/${id}`);
  };

  return (
    <>
      <div className={styles.canvasContainer}>
        <div className={styles.canvas}>
          <PlayScenarioCanvas scene={currScene} incrementor={incrementor} />
        </div>
      </div>
      {/* {window.location === window.parent.location && (
        <ScenarioPreloader scenarioId={scenarioId} graph={graph} key={1} />
      )} */}
    </>
  );
}
