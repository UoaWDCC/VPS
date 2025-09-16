import { useContext, useEffect, useState } from "react";
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
  addFlags,
  removeFlags,
  componentId
) => {
  const token = await user.getIdToken();
  const config = {
    method: "post",
    url: `/api/navigate/user/${scenarioId}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: { currentScene, addFlags, removeFlags, componentId },
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

  const { scenarioId } = useParams();
  const history = useHistory();

  const [sceneId, setSceneId] = useState(null);
  const [addFlags, setAddFlags] = useState([]);
  const [removeFlags, setRemoveFlags] = useState([]);

  const handleError = (error) => {
    if (!error) return;
    if (error.status === 409) {
      onSceneChange();
      toast.success(
        "A move from somewhere else was made, but you're back on track!"
      );
    } else {
      history.push(`/play/${scenarioId}/error`);
    }
  };

  const onSceneChange = async (componentId) => {
    try {
      const newSceneId = await navigate(
        user,
        scenarioId,
        sceneId,
        addFlags,
        removeFlags,
        componentId
      );
      if (!sceneId) {
        setSceneId(newSceneId);
      }
    } catch (e) {
      handleError(e?.response?.data);
    }
  };

  useEffect(() => {
    onSceneChange();
  }, []);

  const buttonPressed = async (component) => {
    const currentSceneId = sceneId;
    const nextSceneId = component.nextScene;
    if (nextSceneId) {
      if (!sceneCache.has(nextSceneId)) return;

      if (sceneCache.get(nextSceneId)?.error)
        handleError(sceneCache.get(nextSceneId));

      setSceneId(nextSceneId);
    }

    onSceneChange(component.id, currentSceneId);
  };

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

    onSceneChange();
  };

  if (loading) return <LoadingPage text="Loading Scene..." />;
  if (authError) return <></>;

  const currScene = sceneCache.get(sceneId);
  if (!currScene) return <LoadingPage text="Loading Scene..." />;

  return (
    <PlayScenarioCanvas
      scene={currScene}
      reset={reset}
      setAddFlags={setAddFlags}
      setRemoveFlags={setRemoveFlags}
      buttonPressed={buttonPressed}
    />
  );
}
