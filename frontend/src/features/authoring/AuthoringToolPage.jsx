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

  // NOTE: we always start at the first scene, could possibly store it in localstorage
  useEffect(() => {
    replace(scenes[0]);

    document.addEventListener("copy", copy);
    document.addEventListener("cut", cut);
    document.addEventListener("paste", paste);
    document.addEventListener("keydown", handleGlobal);
    useEditorStore.getState().clear();

    return () => {
      document.removeEventListener("copy", copy);
      document.removeEventListener("cut", cut);
      document.removeEventListener("paste", paste);
      document.removeEventListener("keydown", handleGlobal);
    };
  }, []);


  function playScenario() {
    window.open(`/play/${scenarioId}`, "_blank");
  }

  function manageGroups() {
    history.push(`/scenario/${scenarioId}/manage-groups`);
  }

  function manageResources() {
    history.push(`/scenario/${scenarioId}/manage-resources`);
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
      <ScreenContainer vertical>
        <TopBar back="/">
          <button className="btn ps w-[100px]" onClick={manageResources}>
            Resources
          </button>
          <button className="btn vps w-[100px]" onClick={manageGroups}>
            Groups
          </button>
          <button className="btn vps w-[100px]" onClick={playScenario}>
            Play
          </button>
          <button className="btn vps" onClick={save}>
            {saveButtonText}
          </button>
        </TopBar>
        <Topbar />
        <div className="flex h-full overflow-hidden">
          <SceneNavigator />
          <Canvas />
          <CanvasSideBar />
        </div>
      </ScreenContainer>
    </>
  );
}
