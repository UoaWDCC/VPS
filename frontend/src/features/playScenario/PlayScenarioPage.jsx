import { useContext, useState, useEffect } from "react";
import { useParams, useHistory } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

import AuthenticationContext from "context/AuthenticationContext";
import { usePost } from "hooks/crudHooks";

import LoadingPage from "../status/LoadingPage";
import PlayScenarioCanvas from "./PlayScenarioCanvas";

const sceneCache = new Map();

// returns the scene id that we should switch to
const navigate = async (
  user,
  scenarioId,
  currentScene,
  nextScene,
  addFlags,
  removeFlags,
  componentId
) => {
  console.log("navigating");

  const token = await user.getIdToken();
  const config = {
    method: "post",
    url: `/api/navigate/user/${scenarioId}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: { currentScene, nextScene, addFlags, removeFlags, componentId },
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
  const [previous, setPrevious] = useState(null);

  const [addFlags, setAddFlags] = useState([]);
  const [removeFlags, setRemoveFlags] = useState([]);

  const [componentId, setComponentId] = useState(null);

  const reload = () => {
    setPrevious(null);
    history.replace(`/play/${scenarioId}/singleplayer`);
  };

  const handleError = (error) => {
    if (!error) return;
    if (error.status === 409) {
      reload();
      toast.success(
        "A move from somewhere else was made, but you're back on track!"
      );
    } else {
      history.push(`/play/${scenarioId}/error`);
    }
  };

  useEffect(() => {
    const onSceneChange = async () => {
      if (sceneId && !previous) return;
      if (sceneCache.get(sceneId)?.error) handleError(sceneCache.get(sceneId));
      try {
        const newSceneId = await navigate(
          user,
          scenarioId,
          previous,
          sceneId,
          addFlags,
          removeFlags,
          componentId
        );
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

    reload();
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
    <PlayScenarioCanvas
      scene={currScene}
      incrementor={incrementor}
      reset={reset}
      setAddFlags={setAddFlags}
      setRemoveFlags={setRemoveFlags}
      setComponentId={setComponentId}
    />
  );
}
