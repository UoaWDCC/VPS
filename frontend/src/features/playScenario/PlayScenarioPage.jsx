import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useHistory, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

import AuthenticationContext from "context/AuthenticationContext";
import { usePost } from "hooks/crudHooks";

import LoadingPage from "../status/LoadingPage";
import PlayScenarioCanvas from "./PlayScenarioCanvas";
import { applyStateOperations } from "../../components/StateVariables/stateOperations";
import NotesPanel from "./components/NotesPanel";
import ResourcesPanel from "./components/ResourcesPanel";
import SceneTimer from "./components/SceneTimer";
import { PlayIcon } from "lucide-react";

const sceneCache = new Map();

const navigateSingleplayer = async (
  user,
  scenarioId,
  currentScene,
  addFlags,
  removeFlags,
  componentId,
  nextScene = null,
  startScene
) => {
  const token = await user.getIdToken();
  const config = {
    method: "post",
    url: `/api/navigate/user/${scenarioId}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: {
      currentScene,
      addFlags,
      removeFlags,
      componentId,
      nextScene,
      startScene,
    },
  };
  const res = await axios.request(config);
  if (res.data.scenes) {
    res.data.scenes.forEach((scene) => sceneCache.set(scene._id, scene));
  }
  return {
    newSceneId: res.data.active,
    stateVariables: res.data.stateVariables,
    newStateVersion: res.data.stateVersion,
  };
};

const navigateMultiplayer = async (
  user,
  groupId,
  currentScene,
  addFlags,
  removeFlags,
  componentId,
  nextScene = null
) => {
  const token = await user.getIdToken();
  const config = {
    method: "post",
    url: `/api/navigate/group/${groupId}`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: { currentScene, addFlags, removeFlags, componentId, nextScene },
  };
  const res = await axios.request(config);
  if (res.data.scenes) {
    res.data.scenes.forEach((scene) => sceneCache.set(scene._id, scene));
  }
  return {
    newSceneId: res.data.active,
    stateVariables: res.data.stateVariables,
    newStateVersion: res.data.stateVersion,
  };
};

function playAudios(scene) {
  const audios = scene.components.filter(c => c.type === "audio");
  const playables = [];
  for (const audio of audios) {
    const playable = new Audio(audio.url);
    playable.loop = audio.loop;
    playable.play();
    playables.push(playable);
  }
  return () => {
    for (const p of playables) {
      p.pause();
      p.currentTime = 0;
    }
  };
}

/**
 * This page allows users to play a scenario.
 *
 * @container
 */
export default function PlayScenarioPage({ group }) {
  const { user, loading, error: authError } = useContext(AuthenticationContext);
  const { scenarioId } = useParams();
  const history = useHistory();
  const location = useLocation();
  const isMultiplayer = location.pathname.includes("/multiplayer");
  // Ref so it survives re-renders without triggering them; consumed once by the initial navigate call and then cleared.
  const startSceneRef = useRef(
    new URLSearchParams(location.search).get("startScene")
  );

  const [sceneId, setSceneId] = useState(null);
  const [stateVariables, setStateVariables] = useState([]);
  const [stateVersion, setStateVersion] = useState(0);
  const [addFlags, setAddFlags] = useState([]);
  const [removeFlags, setRemoveFlags] = useState([]);

  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [audioAllowed, setAudioAllowed] = useState(false);

  const currScene = sceneCache.get(sceneId);

  const handleError = (error) => {
    if (!error) return;
    if (error.status === 409) {
      onSceneChange();
      toast.success(
        isMultiplayer
          ? "Someone else made a move first, but you're back on track!"
          : "A move from somewhere else was made, but you're back on track!"
      );
    } else if (isMultiplayer && error.status === 403) {
      const roles = JSON.stringify(error.meta.roles_with_access);
      history.push(`/play/${scenarioId}/invalid-role?roles=${roles}`);
    } else {
      history.push(`/play/${scenarioId}/error`);
    }
  };

  const onSceneChange = async (componentId) => {
    if (componentId) {
      const component = currScene?.components?.find(
        (comp) => comp.id === componentId
      );
      const stateOperations = component?.stateOperations;
      if (stateOperations) {
        setStateVersion(stateVersion + 1);
        setStateVariables(
          applyStateOperations(stateVariables, stateOperations)
        );
      }
    }

    const startScene = startSceneRef.current;
    startSceneRef.current = null; // Clear before the await so a concurrent retry (409 handler) never replays it.

    try {
      const { newSceneId, stateVariables, newStateVersion } = isMultiplayer
        ? await navigateMultiplayer(
          user,
          group._id,
          sceneId,
          addFlags,
          removeFlags,
          componentId
        )
        : await navigateSingleplayer(
          user,
          scenarioId,
          sceneId,
          addFlags,
          removeFlags,
          componentId,
          null,
          startScene
        );

      if (stateVersion < newStateVersion) {
        setStateVariables(stateVariables);
        setStateVersion(newStateVersion);
      }
      if (!sceneId && newSceneId) {
        setSceneId(newSceneId);
      }
    } catch (e) {
      handleError(e?.response?.data);
    }
  };

  useEffect(() => {
    onSceneChange();
    return () => {
      // Clear cached scenes when leaving or switching scenarios.
      sceneCache.clear();
    };
  }, [scenarioId]);

  useEffect(() => {
    const onKeyDown = async (e) => {
      if (e.repeat || !sceneId || !currScene?.directLink) return;

      const tag = document.activeElement?.tagName;
      const isTyping =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        document.activeElement?.isContentEditable;

      if (isTyping) return;

      if (e.code === "Space" || e.key === "ArrowRight") {
        e.preventDefault();
        try {
          const { newSceneId, stateVariables, newStateVersion } = isMultiplayer
            ? await navigateMultiplayer(
              user,
              group._id,
              sceneId,
              addFlags,
              removeFlags,
              null,
              currScene.directLink
            )
            : await navigateSingleplayer(
              user,
              scenarioId,
              sceneId,
              addFlags,
              removeFlags,
              null,
              currScene.directLink
            );
          if (stateVersion < newStateVersion) {
            setStateVariables(stateVariables);
            setStateVersion(newStateVersion);
          }
          if (newSceneId) {
            if (sceneCache.get(newSceneId)?.error) {
              handleError(sceneCache.get(newSceneId));
              return;
            }
            setSceneId(newSceneId);
          }
        } catch (e) {
          handleError(e?.response?.data);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currScene, sceneId, stateVariables, stateVersion, addFlags, removeFlags]);

  const handleTimerTimeout = () => {
    const timerStateOperations = currScene?.timerStateOperations;
    if (!timerStateOperations?.length) return;
    setStateVersion((v) => v + 1);
    setStateVariables((prev) =>
      applyStateOperations(prev, timerStateOperations)
    );
  };

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
    const resetUrl = isMultiplayer
      ? `api/navigate/group/reset/${group._id}`
      : `api/navigate/user/reset/${scenarioId}`;
    const res = await usePost(
      resetUrl,
      { currentScene: sceneId },
      user.getIdToken.bind(user)
    );

    if (res?.status) {
      handleError(res);
      return;
    }

    setAddFlags([]);
    setRemoveFlags([]);
    onSceneChange();
  };

  useEffect(() => {
    if (!currScene || !audioAllowed) return;
    try {
      const stop = playAudios(currScene);
    } catch (e) {
      toast.error("The audio on this scene failed to play")
    }

    return () => stop();
  }, [currScene, audioAllowed])

  if (loading) return <LoadingPage text="Loading Scene..." />;
  if (authError) return <></>;
  if (isMultiplayer && !group) return <LoadingPage text="Loading Scene..." />;
  if (!currScene) return <LoadingPage text="Loading Scene..." />;

  const incrementor = (id) => {
    if (!sceneCache.has(id)) return;
    history.replace(`/play/${scenarioId}/multiplayer/${id}`);
  };

  return (
    <div className="w-full h-full relative">
      {currScene?.time > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
          <SceneTimer
            key={sceneId}
            duration={currScene.time}
            onTimeout={handleTimerTimeout}
          />
        </div>
      )}
      {!audioAllowed && (
        <div className="absolute top-4 left-4 z-30">
          <button className="btn" onClick={() => setAudioAllowed(true)}>
            <PlayIcon size={16} />
            Enable Audio
          </button>
        </div>
      )}
      <PlayScenarioCanvas
        scene={currScene}
        incrementor={isMultiplayer ? incrementor : undefined}
        reset={reset}
        setAddFlags={setAddFlags}
        setRemoveFlags={setRemoveFlags}
        buttonPressed={buttonPressed}
        stateVariables={stateVariables}
      />

      <div className="absolute top-2 right-2 z-30 flex items-center gap-2">
        {isMultiplayer && (
          <button
            className="btn btn-sm"
            onClick={() => setNoteOpen(true)}
            aria-label="Open notes"
          >
            Notes
          </button>
        )}
        <button
          className="btn btn-sm"
          onClick={() => setResourcesOpen(true)}
          aria-label="Open resources"
        >
          Resources
        </button>
      </div>

      {isMultiplayer && (
        <NotesPanel
          group={group}
          open={noteOpen}
          onClose={() => setNoteOpen(false)}
        />
      )}
      <ResourcesPanel
        scenarioId={scenarioId}
        stateVariables={stateVariables}
        open={resourcesOpen}
        onClose={() => setResourcesOpen(false)}
      />
    </div>
  );
}
