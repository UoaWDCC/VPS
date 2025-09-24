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

/**
 * This page allows the user to edit a scene.
 * @container
 */
export default function AuthoringToolPage() {
  const { currentScene } = useContext(SceneContext);
  const { currentScenario } = useContext(ScenarioContext);
  const { getUserIdToken } = useContext(AuthenticationContext);

  const [saveButtonText, setSaveButtonText] = useState("Save");

  const autosaveTimeout = useRef(null);

  // NOTE: 15 renders on initial page load last i checked
  console.log("authoring page render");

  useEffect(() => {
    // TODO: this is hacky, but it works for now
    console.log(currentScene);
    setScene({
      ...currentScene,
      components: arrayToObject(currentScene?.components),
    });
    const { setVisualScene } = useVisualScene.getState();
    setVisualScene(buildVisualScene(getScene()));
  }, [currentScene]);

  useEffect(() => {
    if (!currentScene?._id) return;
    autosaveTimeout.current = setTimeout(saveScene, 5000);
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
  async function saveScene() {
    const components = Object.values(getScene().components);
    console.log("attempting save", currentScene._id, components);
    await usePut(
      `/api/scenario/${currentScenario._id}/scene/${currentScene._id}`,
      {
        name: currentScene.name,
        time: currentScene.time,
        components,
      },
      getUserIdToken
    );
    console.log("save completed");
  }

  /** called when save button is clicked */
  async function save() {
    setSaveButtonText("Saving");
    await saveScene();
    setSaveButtonText("Saved");
    setTimeout(() => { setSaveButtonText("Save") }, 1800);
  }

  return (
    <>
      <ScreenContainer vertical>
        <TopBar back={`/scenario/${currentScenario?._id}`} confirmModal>
          <button className="btn vps" onClick={save}>
            {saveButtonText}
          </button>
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
