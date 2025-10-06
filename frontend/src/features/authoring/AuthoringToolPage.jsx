import "./AuthoringToolPage.css";

import { useContext, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import HelpButton from "components/HelpButton";
import ScreenContainer from "components/ScreenContainer/ScreenContainer";
import TopBar from "components/TopBar/TopBar";
import AuthenticationContext from "context/AuthenticationContext";
import ScenarioContext from "context/ScenarioContext";
import SceneContext from "context/SceneContext";
import ToolbarContextProvider from "context/ToolbarContextProvider";
import { uploadFiles } from "../../firebase/storage";
import { useGet, usePut } from "hooks/crudHooks";
import CanvasSideBar from "./CanvasSideBar/CanvasSideBar";
import SceneNavigator from "./SceneNavigator/SceneNavigator";

import Canvas from "./canvas/Canvas";
import Topbar from "./topbar/Topbar";
import useVisualScene from "./stores/visual";
import { buildVisualScene } from "./pipeline";
import { getScene, setScene } from "./scene/scene";
import { handleGlobal } from "./handlers/keyboard/keyboard";
import { copy, cut, paste } from "./handlers/keyboard/clipboard";
import { arrayToObject } from "./scene/util";
import useEditorStore from "./stores/editor";
import { useHistory } from "react-router-dom";
import { replace } from "./scene/operations/modifiers";
import { api } from "../../util/api";
import { ArrowLeftIcon, FilesIcon, PlayIcon, UsersIcon } from "lucide-react";

const listeners = [
  ["copy", copy],
  ["cut", cut],
  ["paste", paste],
  ["keydown", handleGlobal],
];

/**
 * This page allows the user to edit a scene.
 * @container
 */
export default function AuthoringToolPage() {
  const { scenes, saveScene } = useContext(SceneContext);
  const { user } = useContext(AuthenticationContext);
  const { scenarioId } = useParams();

  const sceneId = useVisualScene(scene => scene.id);

  const history = useHistory();

  const [saveButtonText, setSaveButtonText] = useState("Save");

  useEffect(() => {
    if (!sceneId) return;
    const autosave = setInterval(save, 10000);
    return () => clearInterval(autosave);
  }, [sceneId]);

  useEffect(() => {
    const activeScene = localStorage.getItem(`${scenarioId}:activeScene`);
    if (activeScene) replace(scenes.find(s => s._id === activeScene));
    else replace(scenes[0]);

    useEditorStore.getState().clear();

    listeners.forEach(([event, fn]) => document.addEventListener(event, fn));

    return () => {
      listeners.forEach(([event, fn]) => document.removeEventListener(event, fn));
    };
  }, []);


  function playScenario() {
    window.open(`/play/${scenarioId}`, "_blank");
  }

  function goToGroups() {
    history.push(`/scenario/${scenarioId}/manage-groups`);
  }

  function goToResources() {
    history.push(`/scenario/${scenarioId}/manage-resources`);
  }

  function goBack() {
    history.push("/");
  }

  /** called when save button is clicked */
  async function save() {
    setSaveButtonText("Saving");
    await saveScene(structuredClone(getScene()));
    setSaveButtonText("Saved");
    setTimeout(() => setSaveButtonText("Save"), 2000);
  }

  return (
    <>
      <div className="font-ibm flex flex-col h-screen w-screen overflow-hidden gap-m">
        <div className="flex pt-l px-l">
          <button onClick={goBack} className="btn btn-phantom text-m">
            <ArrowLeftIcon size={20} />
            Back
          </button>
          <button onClick={goToResources} className="btn btn-phantom text-m ml-auto">
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
          <Topbar saveText={saveButtonText} save={save} />
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
