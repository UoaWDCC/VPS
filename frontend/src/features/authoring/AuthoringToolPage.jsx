import "./AuthoringToolPage.css";

import { useContext, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import HelpButton from "components/HelpButton";
import ScreenContainer from "components/ScreenContainer/ScreenContainer";
import TopBar from "components/TopBar/TopBar";
import AuthenticationContext from "context/AuthenticationContext";
import AuthoringToolContext from "context/AuthoringToolContext";
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

/**
 * This page allows the user to edit a scene.
 * @container
 */
export default function AuthoringToolPage() {
  const { scenarioId, sceneId } = useParams();
  const {
    currentScene,
    setCurrentScene,
    setMonitorChange,
    setHasChange,
    reFetch,
  } = useContext(SceneContext);
  const { currentScenario } = useContext(ScenarioContext);
  const { setSelect } = useContext(AuthoringToolContext);
  const { getUserIdToken } = useContext(AuthenticationContext);
  const [firstTimeRender, setFirstTimeRender] = useState(true);
  const [saveButtonText, setSaveButtonText] = useState("Save");
  const autosaveTimeout = useRef(null);

  const setComponents = useVisualScene((state) => state.setComponents);

  useEffect(() => {
    // hb: i have no clue what these are for
    if (firstTimeRender) {
      setFirstTimeRender(false);
    } else {
      setMonitorChange(true);
    }

    // TODO: this is hacky, but it works for now
    console.log(currentScene);
    setScene({
      ...currentScene,
      components: arrayToObject(currentScene?.components),
    });
    setComponents(buildVisualScene(getScene()));
  }, [currentScene, setComponents]);

  useEffect(() => {
    if (!currentScene || !currentScene._id) return;
    if (firstTimeRender) return;
    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    autosaveTimeout.current = setTimeout(() => {
      saveScene(true);
    }, 2000);
    return () => clearTimeout(autosaveTimeout.current);
  }, [currentScene]);

  useEffect(() => {
    document.addEventListener("copy", copy);
    document.addEventListener("cut", cut);
    document.addEventListener("paste", paste);
    document.addEventListener("keydown", handleGlobal);

    return () => {
      document.removeEventListener("copy", copy);
      document.removeEventListener("cut", cut);
      document.removeEventListener("paste", paste);
      document.removeEventListener("keydown", handleGlobal);
    };
  }, []);

  /** used to save the scene, as a helper function */
  async function saveScene(isAuto = false) {
    if (!isAuto) {
      // only clear selection on manual save
      setSelect(null);
    }
    await uploadFiles(
      currentScene?.components,
      currentScene?.endImage,
      currentScenario._id,
      currentScene._id
    );
    await usePut(
      `/api/scenario/${scenarioId}/scene/${sceneId}`,
      {
        name: currentScene.name,
        time: currentScene.time,
        components: Object.values(getScene().components),
      },
      getUserIdToken
    );
    setHasChange(false);
    reFetch();
  }

  /** called when save button is clicked */
  async function save() {
    await saveScene();
    setSaveButtonText("Saved!");
    setTimeout(() => {
      setSaveButtonText("Save");
    }, 1800);
  }

  /** called when save and close button is clicked */
  async function savePlusClose() {
    await save();
    /* redirects user to the scenario page */
    window.location.href = `/scenario/${currentScenario?._id}`;
  }

  return (
    <>
      <ScreenContainer vertical>
        <TopBar back={`/scenario/${currentScenario?._id}`} confirmModal>
          <button className="btn vps w-[150px]" onClick={save}>
            {saveButtonText}
          </button>
          <button className="btn vps w-[150px]" onClick={savePlusClose}>
            Save & Close
          </button>
          <HelpButton />
        </TopBar>
        <Topbar />
        <div className="flex h-full overflow-hidden">
          <SceneNavigator saveScene={saveScene} />
          <Canvas />
          <CanvasSideBar />
        </div>
      </ScreenContainer>
    </>
  );
}
