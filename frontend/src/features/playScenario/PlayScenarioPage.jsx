import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useHistory, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

import AuthenticationContext from "context/AuthenticationContext";
import { api } from "../../util/api";

import LoadingPage from "../status/LoadingPage";
import PlayScenarioCanvas from "./PlayScenarioCanvas";
import { applyPropertyOperations } from "../../components/Properties/propertyOperations";
import NotesPanel from "./components/NotesPanel";
import SceneTimer from "./components/SceneTimer";
import StartAudioPanel from "./components/StartAudioPanel";
import {
  BookMarkedIcon,
  FilesIcon,
  Volume2Icon,
  VolumeOffIcon,
} from "lucide-react";
import ResourcesPanel from "../resources/ResourcesOverlay";

const sceneCache = new Map();

// Caches the scenes from a navigate response and patches in the
// server-authoritative remaining time for the active scene, so a refresh
// resumes the countdown instead of restarting it.
function cacheNavigateResponse(data) {
  if (data.scenes) {
    data.scenes.forEach((scene) => sceneCache.set(scene._id, scene));
  }
  if (data.active && data.remainingTime != null) {
    const active = sceneCache.get(data.active);
    if (active) active.remainingTime = data.remainingTime;
  }
  return {
    newSceneId: data.active,
    properties: data.properties,
    newPropertyVersion: data.propertyVersion,
  };
}

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
  return cacheNavigateResponse(res.data);
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
  return cacheNavigateResponse(res.data);
};

const refreshFromServer = async (user, scenarioId, groupId, isMultiplayer) => {
  const token = await user.getIdToken();
  const config = isMultiplayer
    ? {
        method: "post",
        url: `/api/navigate/group/${groupId}`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: {
          currentScene: null,
          addFlags: [],
          removeFlags: [],
          componentId: null,
          nextScene: null,
        },
      }
    : {
        method: "post",
        url: `/api/navigate/user/${scenarioId}`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: {
          currentScene: null,
          addFlags: [],
          removeFlags: [],
          componentId: null,
          nextScene: null,
          startScene: null,
        },
      };
  const res = await axios.request(config);
  if (res.data.scenes) {
    res.data.scenes.forEach((scene) => sceneCache.set(scene._id, scene));
  }
  return {
    newSceneId: res.data.active,
    properties: res.data.properties,
    newPropertyVersion: res.data.propertyVersion,
  };
};

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
  // Track sequence of navigation & recovery requests to prevent race conditions
  const requestIdRef = useRef(0);
  const handlingConflictRef = useRef(false);

  const [sceneId, setSceneId] = useState(null);
  const [properties, setProperties] = useState([]);
  const [propertyVersion, setPropertyVersion] = useState(0);
  const [addFlags, setAddFlags] = useState([]);
  const [removeFlags, setRemoveFlags] = useState([]);

  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [startAudioOpen, setStartAudioOpen] = useState(true);
  const [audioMuted, setAudioMuted] = useState(true);

  const audioRefs = useRef([]);

  const currScene = sceneCache.get(sceneId);

  const handleError = async (error) => {
    if (!error) return;
    if (error.status === 409) {
      if (!handlingConflictRef.current) {
        handlingConflictRef.current = true;

        // Track recovery request ID
        const currentRequestId = ++requestIdRef.current;

        try {
          const { newSceneId, properties, newPropertyVersion } =
            await refreshFromServer(user, scenarioId, group._id, isMultiplayer);

          // Discard response if a newer user action was triggered during request transit
          if (currentRequestId !== requestIdRef.current) return;

          setSceneId(newSceneId);
          setProperties(properties);
          setPropertyVersion(newPropertyVersion);
          toast.success(
            isMultiplayer
              ? "Someone else made a move first, but you're back on track!"
              : "A move from somewhere else was made, but you're back on track!"
          );
        } catch {
          // If refresh fails, navigate to error page
          history.push(`/play/${scenarioId}/error`);
        } finally {
          handlingConflictRef.current = false;
        }
      }
    } else if (isMultiplayer && error.status === 403) {
      const roles = JSON.stringify(error.meta.roles_with_access);
      history.push(`/play/${scenarioId}/invalid-role?roles=${roles}`);
    } else {
      history.push(`/play/${scenarioId}/error`);
    }
  };

  const onSceneChange = async (componentId, currentSceneOverride = sceneId) => {
    const currentRequestId = ++requestIdRef.current; // Track navigation request ID

    if (componentId) {
      const component = currScene?.components?.find(
        (comp) => comp.id === componentId
      );
      const propertyOperations = component?.stateOperations;
      if (propertyOperations) {
        setPropertyVersion(propertyVersion + 1);
        setProperties(applyPropertyOperations(properties, propertyOperations));
      }
    }

    const startScene = startSceneRef.current;
    startSceneRef.current = null; // Clear after first use so startScene override is consumed once.

    try {
      const { newSceneId, properties, newPropertyVersion } = isMultiplayer
        ? await navigateMultiplayer(
            user,
            group._id,
            currentSceneOverride,
            addFlags,
            removeFlags,
            componentId
          )
        : await navigateSingleplayer(
            user,
            scenarioId,
            currentSceneOverride,
            addFlags,
            removeFlags,
            componentId,
            null,
            startScene
          );

      // Discard stale response if a newer request was dispatched while this request was pending
      if (currentRequestId !== requestIdRef.current) return;

      if (propertyVersion < newPropertyVersion) {
        setProperties(properties);
        setPropertyVersion(newPropertyVersion);
      }
      if (newSceneId) {
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
        const currentRequestId = ++requestIdRef.current; // Track keydown navigation request ID
        try {
          const { newSceneId, properties, newPropertyVersion } = isMultiplayer
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

          // Discard stale response if a newer request was dispatched while pending
          if (currentRequestId !== requestIdRef.current) return;

          if (propertyVersion < newPropertyVersion) {
            setProperties(properties);
            setPropertyVersion(newPropertyVersion);
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
  }, [currScene, sceneId, properties, propertyVersion, addFlags, removeFlags]);

  const handleTimerTimeout = () => {
    const timerStateOperations = currScene?.timerStateOperations;
    if (!timerStateOperations?.length) return;
    setPropertyVersion((v) => v + 1);
    setProperties((prev) =>
      applyPropertyOperations(prev, timerStateOperations)
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
    try {
      await api.post(user, resetUrl, { currentScene: sceneId });
    } catch (e) {
      handleError(e?.response?.data);
      return;
    }

    setAddFlags([]);
    setRemoveFlags([]);
    onSceneChange();
  };

  const cleanUpAudios = () => {
    audioRefs.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    audioRefs.current = [];
  };

  const playAudios = () => {
    audioRefs.current.forEach((audio) => {
      audio.play();
    });
  };

  useEffect(() => {
    if (!currScene) return;
    try {
      const audios = currScene.components.filter((c) => c.type === "audio");
      audioRefs.current = audios.map((audio) => {
        const audioElement = new Audio(audio.url);
        audioElement.loop = audio.loop || false;
        audioElement.muted = audioMuted;
        return audioElement;
      });
      playAudios();
      return () => cleanUpAudios();
    } catch {
      toast.error("The audio on this scene failed to play");
    }
  }, [currScene]);

  useEffect(() => {
    audioRefs.current.forEach((audio) => {
      audio.muted = audioMuted;
    });
  }, [audioMuted]);

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
            initialSeconds={currScene.remainingTime ?? currScene.time}
            onTimeout={handleTimerTimeout}
          />
        </div>
      )}
      <PlayScenarioCanvas
        scene={currScene}
        incrementor={isMultiplayer ? incrementor : undefined}
        reset={reset}
        setAddFlags={setAddFlags}
        setRemoveFlags={setRemoveFlags}
        buttonPressed={buttonPressed}
        properties={properties}
      />

      <div className="absolute top-2 right-2 z-30 flex items-center gap-2">
        <div
          className="tooltip tooltip-bottom"
          data-tip={audioMuted ? "Unmute audio" : "Mute audio"}
        >
          <button
            className="btn"
            onClick={() => setAudioMuted(!audioMuted)}
            type="button"
            aria-label={audioMuted ? "Unmute audio" : "Mute audio"}
          >
            {audioMuted ? (
              <VolumeOffIcon size={16} />
            ) : (
              <Volume2Icon size={16} />
            )}
          </button>
        </div>
        {isMultiplayer && (
          <div className="tooltip tooltip-left" data-tip="Open notes">
            <button
              className="btn"
              onClick={() => setNoteOpen(true)}
              type="button"
              aria-label="Open notes"
            >
              <FilesIcon size={16} />
            </button>
          </div>
        )}
        <div className="tooltip tooltip-left" data-tip="Open resources">
          <button
            className="btn"
            onClick={() => setResourcesOpen(true)}
            type="button"
            aria-label="Open resources"
          >
            <BookMarkedIcon size={16} />
          </button>
        </div>
      </div>

      <StartAudioPanel
        open={startAudioOpen}
        onClose={() => setStartAudioOpen(false)}
        setAudioMuted={setAudioMuted}
      />
      {isMultiplayer && (
        <NotesPanel
          group={group}
          open={noteOpen}
          onClose={() => setNoteOpen(false)}
        />
      )}
      <ResourcesPanel
        scenarioId={scenarioId}
        properties={properties}
        open={resourcesOpen}
        onClose={() => setResourcesOpen(false)}
      />
    </div>
  );
}
