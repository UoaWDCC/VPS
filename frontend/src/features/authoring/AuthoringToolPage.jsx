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
import Canvas from "./Canvas/Canvas";
import CanvasSideBar from "./CanvasSideBar/CanvasSideBar";
import SceneNavigator from "./SceneNavigator/SceneNavigator";
import ToolBar from "./ToolBar/ToolBar";

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

  useGet(
    `/api/scenario/${currentScenario?._id}/scene/full/${currentScene?._id}`,
    setCurrentScene,
    true
  );

  useEffect(async () => {
    reFetch();
  }, []);

  useEffect(() => {
    if (firstTimeRender) {
      setFirstTimeRender(false);
    } else {
      setMonitorChange(true);
    }
  }, [currentScene]);

  useEffect(() => {
    if (!currentScene || !currentScene._id) return;
    if (firstTimeRender) return;
    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    autosaveTimeout.current = setTimeout(() => {
      saveScene(true);
    }, 2000);
    return () => clearTimeout(autosaveTimeout.current);
  }, [currentScene]);

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
        components: currentScene?.components,
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
        <ToolbarContextProvider>
          <ToolBar />
        </ToolbarContextProvider>
        <div className="flex" style={{ height: "100%", overflow: "hidden" }}>
          <SceneNavigator saveScene={saveScene} />
          <Canvas />
          <CanvasSideBar />
        </div>
      </ScreenContainer>
    </>
  );
}
