import "./AuthoringToolPage.css";

import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SceneContext from "context/SceneContext";
import CanvasSideBar from "./CanvasSideBar/CanvasSideBar";
import SceneNavigator from "./SceneNavigator/SceneNavigator";

import Canvas from "./canvas/Canvas";
import Topbar from "./topbar/Topbar";
import useVisualScene from "./stores/visual";
import { getScenePatch, commitSavedScene } from "./scene/scene";
import { copy, cut, paste } from "./handlers/keyboard/clipboard";
import useEditorStore from "./stores/editor";
import { useHistory } from "react-router-dom";
import { replace } from "./scene/operations/modifiers";
import { ArrowLeftIcon, FilesIcon, PlayIcon, UsersIcon } from "lucide-react";
import { handleGlobal } from "./handlers/keyboard/keyboard";

const listeners = [
  ["copy", copy],
  ["cut", cut],
  ["paste", paste],
  ["keydown", handleGlobal],
];

const AUTOSAVE_INTERVAL = 30000; // 30 secs

/**
 * This page allows the user to edit a scene.
 * @container
 */
export default function AuthoringToolPage() {
  const { scenes, saveScenePatch } = useContext(SceneContext);
  const { scenarioId } = useParams();

  const sceneId = useVisualScene((scene) => scene.id);

  const history = useHistory();

  const [saving, setSaving] = useState(false);

  // autosave setup
  useEffect(() => {
    if (!sceneId) return;
    const autosave = setInterval(save, AUTOSAVE_INTERVAL);
    return () => clearInterval(autosave);
  }, [sceneId]);

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
    if (saving) return; // we dont want to interrupt in progress saves (usually uploading media)
    setSaving(true);

    const patch = getScenePatch();

    const hasChanges =
      Object.keys(patch.fields).length > 0 ||
      patch.components.length > 0 ||
      patch.deletedComponentIds.length > 0;

    if (!hasChanges) {
      setSaving(false);
      return;
    }

    await saveScenePatch(patch);
    commitSavedScene();

    setTimeout(() => setSaving(false), 5000);
  }

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
    </>
  );
}
