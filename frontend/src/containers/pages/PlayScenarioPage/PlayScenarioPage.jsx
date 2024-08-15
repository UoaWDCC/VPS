import { useContext, useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import AuthenticationContext from "context/AuthenticationContext";
import axios from "axios";
import { usePost } from "hooks/crudHooks";
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
    url: `/api/navigate/user/${scenarioId}`,
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

  const handleError = (error) => {
    if (!error) return;
    if (error.status === 409) {
      history.push(`/play/${scenarioId}/desync`);
    } else {
      history.push(`/play/${scenarioId}/error`);
    }
  };

  useEffect(() => {
    const onSceneChange = async () => {
      if (sceneId && !previous) return;
      if (sceneCache.get(sceneId)?.error) handleError(sceneCache.get(sceneId));
      try {
        const newSceneId = await navigate(user, scenarioId, previous, sceneId);
        if (!sceneId)
          history.replace(`/play/${scenarioId}/singleplayer/${newSceneId}`);
      } catch (e) {
        handleError(e?.response?.data);
      }
    };
    onSceneChange();
  }, [sceneId]);

  const reset = async () => {
    const res = await usePost(
      `api/navigate/user/reset/${scenarioId}`,
      { currentScene: sceneId },
      user.getIdToken.bind(user)
    );
    if (res.status) {
      handleError(res);
      return;
    }

    console.log("reset");
    setPrevious(null);
    history.replace(`/play/${scenarioId}/singleplayer`);
  };

  if (loading) return <LoadingPage text="Loading Scene..." />;
  if (authError) return <></>;

  const currScene = sceneCache.get(sceneId);
  if (!currScene) return <LoadingPage text="Loading Scene..." />;

  const incrementor = (id) => {
    if (!sceneCache.has(id)) return;
    setPrevious(sceneId);
    history.replace(`/play/${scenarioId}/singleplayer/${id}`);
  };

  return (
    <>
      <div className={styles.canvasContainer}>
        <div className={styles.canvas}>
          <PlayScenarioCanvas
            scene={currScene}
            incrementor={incrementor}
            reset={reset}
          />
        </div>
      </div>
      {/* {window.location === window.parent.location && (
        <ScenarioPreloader scenarioId={scenarioId} graph={graph} key={1} />
      )} */}
    </>
  );
}
