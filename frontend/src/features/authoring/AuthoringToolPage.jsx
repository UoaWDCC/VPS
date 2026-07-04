import { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SceneContext from "context/SceneContext";
import CanvasSideBar from "./CanvasSideBar/CanvasSideBar";
import SceneNavigator from "./SceneNavigator/SceneNavigator";

import Canvas from "./canvas/Canvas";
import Topbar from "./topbar/Topbar";
import useVisualScene from "./stores/visual";
import { copy, cut, paste } from "./handlers/keyboard/clipboard";
import useEditorStore from "./stores/editor";
import { useHistory } from "react-router-dom";
import { replace, replaceComponent } from "./scene/operations/modifiers";
import {
  ArrowLeftIcon,
  FilesIcon,
  PlayIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { handleGlobal } from "./handlers/keyboard/keyboard";
import { clearHistory, historyEvents } from "./scene/history";
import { debounce } from "../../util/debounce";
import { getScene } from "./scene/scene";
import ShareModal from "./components/ShareModal";
import ScenarioContext from "../../context/ScenarioContext";

const listeners = [
  ["copy", copy],
  ["cut", cut],
  ["paste", paste],
  ["keydown", handleGlobal],
];

// const AUTOSAVE_INTERVAL = 30000; // 30 secs

/**
 * This page allows the user to edit a scene.
 * @container
 */
export default function AuthoringToolPage() {
  const { scenes, modifyScene, switchScene } = useContext(SceneContext);
  const { allScenarios } = useContext(ScenarioContext);
  const { scenarioId } = useParams();

  const sceneId = useVisualScene((scene) => scene.id);
  const setSelected = useEditorStore((state) => state.setSelected);

  const history = useHistory();

  const [saving, setSaving] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const pendingSavesRef = useRef(0);

  // NOTE: this is both the autosaver and the history actioner, which are distinct
  // operations, but are both here due to the limitations of the scene context
  useEffect(() => {
    const debounced = debounce(async () => {
      try {
        pendingSavesRef.current++;
        await modifyScene(getScene());
      } finally {
        pendingSavesRef.current--;
        if (pendingSavesRef.current === 0) setSaving(false);
      }
    }, 2500);

    const listener = async ({ operation, record }) => {
      if (operation === "undo" || operation === "redo") {
        if (record.sceneId !== sceneId) switchScene(getScene(), record.sceneId);
        const state = operation === "undo" ? record.before : record.after;
        if (state === null) setSelected(null);
        replaceComponent(record.id, state);
        if (state !== null) setSelected(record.id);
      }

      setSaving(true);
      debounced();
    };

    historyEvents.addEventListener("update", listener);
    return () => historyEvents.removeEventListener("update", listener);
  }, [sceneId, switchScene, setSelected, modifyScene]);

  // if the active scene was deleted, switch to the first available scene
  useEffect(() => {
    if (!sceneId || !scenes) return;
    if (!scenes.find((s) => s._id === sceneId)) {
      const next = scenes[0];
      if (next) replace(next);
    }
  }, [scenes]);

  useEffect(() => {
    const activeScene = localStorage.getItem(`${scenarioId}:activeScene`);
    const found = activeScene
      ? scenes.find((s) => s._id === activeScene)
      : null;
    const target = found ?? scenes[0];
    if (target) replace(target);

    useEditorStore.getState().clear();

    clearHistory();

    listeners.forEach(([event, fn]) => document.addEventListener(event, fn));

    return () => {
      listeners.forEach(([event, fn]) =>
        document.removeEventListener(event, fn)
      );
    };
  }, []);

  function playScenario() {
    const startScene = sceneId ? `?startScene=${sceneId}` : "";
    window.open(`/play/${scenarioId}${startScene}`, "_blank");
  }

  function goToGroups() {
    history.push(`/scenario/${scenarioId}/manage-groups`);
  }

  function goToResources() {
    history.push(`/scenario/${scenarioId}/manage-resources`);
  }

  function goBack() {
    history.push("/create");
  }

  async function save() {
    setSaving(true);
    try {
      await modifyScene(getScene());
    } finally {
      setSaving(false);
    }
  }

  const isScenarioOwner = allScenarios?.owned.find((s) => s._id === scenarioId);

  return (
    <>
      <div className="font-ibm flex flex-col h-screen w-screen overflow-hidden gap-m">
        <div className="flex pt-l px-l">
          <button onClick={goBack} className="btn btn-phantom text-m">
            <ArrowLeftIcon size={20} />
            Back
          </button>
          <button
            onClick={goToResources}
            className="btn btn-phantom text-m ml-auto"
          >
            <FilesIcon size={20} />
            Resources
          </button>
          <button onClick={goToGroups} className="btn btn-phantom text-m">
            <UsersIcon size={20} />
            Groups
          </button>
          {isScenarioOwner && (
            <button
              onClick={() => setShareModalOpen(true)}
              className="btn btn-phantom text-m"
            >
              <UserPlusIcon size={20} />
              Share
            </button>
          )}
          <button onClick={playScenario} className="btn btn-phantom text-m">
            <PlayIcon size={20} />
            Play
          </button>
        </div>
        <div className="flex flex-col gap-m px-l flex-1 min-h-0">
          <Topbar saving={saving} save={save} />
          <div className="flex gap-m flex-1 min-h-0">
            <SceneNavigator />
            <Canvas />
            <CanvasSideBar />
          </div>
        </div>
      </div>
      {isScenarioOwner && (
        <ShareModal open={shareModalOpen} setOpen={setShareModalOpen} />
      )}
    </>
  );
}
