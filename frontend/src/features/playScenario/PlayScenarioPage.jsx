import { useContext, useEffect, useRef, useState } from "react";
import { useParams, useHistory, useLocation } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

import AuthenticationContext from "context/AuthenticationContext";
import { usePost } from "hooks/crudHooks";

import LoadingPage from "../status/LoadingPage";
import PlayScenarioCanvas from "./PlayScenarioCanvas";
import { applyPropertyOperations } from "../../components/Properties/propertyOperations";
import NotesPanel from "./components/NotesPanel";
import SceneTimer from "./components/SceneTimer";
import StartAudioPanel from "./components/StartAudioPanel";
import {
  BookMarkedIcon,
  BugIcon,
  FilesIcon,
  Volume2Icon,
  VolumeOffIcon,
} from "lucide-react";
import ResourcesPanel from "../resources/ResourcesOverlay";
import useLocalStorage from "hooks/useLocalStorage";
import { api } from "../../util/api";
import DebugPanel from "./debug/DebugPanel";
import useDebugSession from "./debug/useDebugSession";
import { componentLabel, describeOperation } from "./debug/describe";

const sceneCache = new Map();

// A scene's connected scenes only arrive in the response that makes it active.
// Until then (the page switches scenes before that response lands) its buttons
// can point at scenes that just aren't loaded yet, so the scene is marked once
// its neighbours are in. The debug panel uses this to avoid false alarms.
function cacheScenes(data) {
  if (!data.scenes) return;
  data.scenes.forEach((scene) => sceneCache.set(scene._id, scene));
  const active = sceneCache.get(data.active);
  if (active) active.neighborsLoaded = true;
}

// Caches the scenes from a navigate response and patches in the
// server-authoritative remaining time for the active scene, so a refresh
// resumes the countdown instead of restarting it.
function cacheNavigateResponse(data) {
  cacheScenes(data);
  if (data.active && data.remainingTime != null) {
    const active = sceneCache.get(data.active);
    if (active) active.remainingTime = data.remainingTime;
  }
  return {
    newSceneId: data.active,
    properties: data.properties,
    newPropertyVersion: data.propertyVersion,
    // Only sent when the page loads, undefined on later moves
    isAuthor: data.isAuthor,
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
  cacheScenes(res.data);
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
  // Told by the server on page load; the debug panel is for scenario authors
  const [isAuthor, setIsAuthor] = useState(false);
  const [debugOpen, setDebugOpen] = useLocalStorage("vps-debug-open", false);
  // Every scene of the scenario, for the debug panel's jump menu
  const [debugScenes, setDebugScenes] = useState([]);
  const [debugBusy, setDebugBusy] = useState(false);
  // Bumped when the scene timer has to start over (debug resets and jumps)
  const [timerEpoch, setTimerEpoch] = useState(0);

  const audioRefs = useRef([]);

  const currScene = sceneCache.get(sceneId);

  const debug = useDebugSession({
    enabled: isAuthor,
    sceneId,
    scene: currScene,
    properties,
    hasScene: (id) => sceneCache.has(id),
  });

  useEffect(() => {
    if (!isAuthor || !user) return;
    api
      .get(user, `/api/scenario/${scenarioId}/scene`)
      .then((res) => setDebugScenes(res.data))
      .catch(() =>
        debug.log("error", "Couldn't load the scene list", [
          "The jump menu will be empty",
        ])
      );
  }, [isAuthor, scenarioId]);

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
          debug.log("sync", "Out of sync with the server", [
            "Reloaded the current scene and properties",
          ]);
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
      debug.log("error", "Navigation failed", [
        error.error ?? `Status ${error.status}`,
      ]);
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
      const {
        newSceneId,
        properties,
        newPropertyVersion,
        isAuthor: author,
      } = isMultiplayer
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

      // Before the scene is set, so the debug session is on for the first scene
      if (author !== undefined) setIsAuthor(author);

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

      // Space on a focused debug panel button should press the button, not move the player on
      if (document.activeElement?.closest("[data-debug-panel]")) return;

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

          debug.log("link", "Used the direct link", [
            "Space or the right arrow key",
          ]);

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
    debug.log(
      "timer",
      "Scene timer ran out",
      (timerStateOperations ?? []).map((op) =>
        describeOperation(op, properties)
      )
    );
    if (!timerStateOperations?.length) return;
    setPropertyVersion((v) => v + 1);
    setProperties((prev) =>
      applyPropertyOperations(prev, timerStateOperations)
    );
  };

  const buttonPressed = async (component) => {
    const currentSceneId = sceneId;
    const nextSceneId = component.nextScene;

    // The pressed component may be a rendered copy, so label the stored one
    const label = componentLabel(
      currScene?.components?.find((c) => c.id === component.id) ?? component
    );
    debug.log("press", `Pressed ${label}`);

    if (nextSceneId) {
      if (!sceneCache.has(nextSceneId)) {
        debug.log("warn", `${label} did nothing`, [
          "The scene it leads to doesn't exist or couldn't be loaded",
        ]);
        return;
      }

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

  // Runs a debug tool, reporting a failure without leaving the scenario
  const runDebugTool = async (what, tool) => {
    setDebugBusy(true);
    try {
      await tool();
    } catch (e) {
      toast.error(`Couldn't ${what}`);
      debug.log("error", `Couldn't ${what}`, [
        e?.response?.data?.error ?? e.message,
      ]);
    } finally {
      setDebugBusy(false);
    }
  };

  // Unlike a normal move, which only takes properties newer than the page's
  // own count, these take the server's word for the scene and properties.
  const adoptServerState = ({ newSceneId, properties, newPropertyVersion }) => {
    requestIdRef.current++; // a move still on its way is now out of date
    setProperties(properties);
    setPropertyVersion(newPropertyVersion);
    if (newSceneId) setSceneId(newSceneId);
    setTimerEpoch((epoch) => epoch + 1);
  };

  const debugUrl = `/api/navigate/user/debug/${scenarioId}`;

  const debugResetAll = () =>
    runDebugTool("reset the scenario", async () => {
      const res = await api.post(user, debugUrl, { mode: "all" });
      adoptServerState(cacheNavigateResponse(res.data));
      setAddFlags([]);
      setRemoveFlags([]);
      debug.log("reset", "Reset everything", [
        "Back at the first scene with default properties",
      ]);
    });

  const debugResetProperties = () =>
    runDebugTool("reset the properties", async () => {
      const res = await api.post(user, debugUrl, { mode: "properties" });
      requestIdRef.current++;
      setProperties(res.data.properties);
      setPropertyVersion(res.data.propertyVersion);
      debug.log("reset", "Reset properties", [
        "Back to the scenario's defaults",
      ]);
    });

  const debugRestartTimer = () =>
    runDebugTool("restart the timer", async () => {
      const res = await api.post(user, debugUrl, { mode: "timer" });
      if (currScene) currScene.remainingTime = res.data.remainingTime;
      setTimerEpoch((epoch) => epoch + 1);
      debug.log("reset", "Restarted the scene timer");
    });

  // The server already lets authors start anywhere (startScene), replacing
  // their path and restarting the timer but keeping their properties
  const debugJump = (targetId) =>
    runDebugTool("jump to that scene", async () => {
      const result = await navigateSingleplayer(
        user,
        scenarioId,
        null,
        [],
        [],
        null,
        null,
        targetId
      );
      adoptServerState(result);
      const name =
        debugScenes.find((scene) => scene._id === targetId)?.name ??
        "another scene";
      debug.log("jump", `Jumped to ${name}`, [
        "Path replaced, timer restarted, properties kept",
      ]);
    });

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
    // The debug panel docks beside the scene rather than over it, so the
    // play area shrinks (the scene scales to fit) and stays fully playable.
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="relative h-full min-w-0 flex-1">
        {currScene?.time > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
            <SceneTimer
              key={`${sceneId}:${timerEpoch}`}
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
          {isAuthor && (
            <div
              className="tooltip tooltip-bottom"
              data-tip={debugOpen ? "Close debug panel" : "Open debug panel"}
            >
              <span className="indicator">
                {debug.problemCount > 0 && (
                  <span className="indicator-item badge badge-warning badge-xs">
                    {debug.problemCount}
                  </span>
                )}
                <button
                  className={`btn ${debugOpen ? "btn-active" : ""}`}
                  onClick={() => setDebugOpen(!debugOpen)}
                  type="button"
                  aria-label={
                    debugOpen ? "Close debug panel" : "Open debug panel"
                  }
                  aria-pressed={debugOpen}
                >
                  <BugIcon size={16} />
                </button>
              </span>
            </div>
          )}
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
      </div>

      {isAuthor && (
        <DebugPanel
          open={debugOpen}
          onClose={() => setDebugOpen(false)}
          scene={currScene}
          properties={properties}
          propertyVersion={propertyVersion}
          session={debug}
          getScene={(id) => sceneCache.get(id)}
          onRun={buttonPressed}
          scenes={debugScenes}
          busy={debugBusy}
          onResetAll={debugResetAll}
          onResetProperties={debugResetProperties}
          onRestartTimer={debugRestartTimer}
          onJump={debugJump}
        />
      )}

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
