import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { Button } from "@material-ui/core";
import TopBar from "../../../components/TopBar";
import ToolBar from "./ToolBar/ToolBar";
import Canvas from "./Canvas/Canvas";
import CanvasSideBar from "./CanvasSideBar/CanvasSideBar";
import ScreenContainer from "../../../components/ScreenContainer";
import ScenarioContext from "../../../context/ScenarioContext";
import { useGet, usePut } from "../../../hooks/crudHooks";
import SceneContext from "../../../context/SceneContext";
import AuthoringToolContext from "../../../context/AuthoringToolContext";
import ToolbarContextProvider from "../../../context/ToolbarContextProvider";
import AuthenticationContext from "../../../context/AuthenticationContext";
import { uploadFiles } from "../../../firebase/storage";
import HelpButton from "../../../components/HelpButton";
import SceneNavigator from "./SceneNavigator/SceneNavigator";

/**
 * This page allows the user to edit a scene.
 * @container
 */
export default function AuthoringToolPage() {
  const { scenarioId, sceneId } = useParams();
  const {
    scenes,
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
  const [disableNext, setDisableNext] = useState(false);
  const [disableBefore, setDisableBefore] = useState(false);
  const history = useHistory();
  useGet(
    `/api/scenario/${currentScenario?._id}/scene/full/${currentScene?._id}`,
    setCurrentScene,
    false
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

  /** used to save the scene, as a helper function */
  async function saveScene() {
    setSelect(null);
    await uploadFiles(
      currentScene?.components,
      currentScenario._id,
      currentScene._id
    );
    await usePut(
      `/api/scenario/${scenarioId}/scene/${sceneId}`,
      {
        name: currentScene.name,
        components: currentScene?.components,
      },
      getUserIdToken
    );
    setHasChange(false);
    reFetch();
  }

  /** called when save button is clicked */
  async function save() {
    saveScene();
    setSaveButtonText("Saved!");
    setTimeout(() => {
      setSaveButtonText("Save");
    }, 1800);
  }

  /** called when save and close button is clicked */
  function savePlusClose() {
    saveScene();
    /* redirects user to the scenario page */
    window.location.href = `/scenario/${currentScenario?._id}`;
  }

  function updateScene(direction) {
    const ids = scenes.map((scene) => scene._id);
    const oldIndex = ids.indexOf(currentScene._id);
    const newIndex = oldIndex + direction;

    if (newIndex > -1 && newIndex < ids.length) {
      saveScene();
      setDisableBefore(false);
      setDisableNext(false);
      setCurrentScene(scenes[newIndex]);
      history.push({
        pathname: `/scenario/${scenarioId}/scene/${scenes[newIndex]._id}`,
      });
    }

    if (newIndex === ids.length - 1) {
      setDisableNext(true);
    }

    if (newIndex === 0) {
      setDisableBefore(true);
    }
  }

  return (
    <>
      <ScreenContainer vertical>
        <TopBar back={`/scenario/${currentScenario?._id}`} confirmModal>
          <Button
            className="btn top contained white"
            color="default"
            variant="contained"
            onClick={save}
          >
            {saveButtonText}
          </Button>
          <Button
            className="btn top contained white"
            color="default"
            variant="contained"
            onClick={savePlusClose}
          >
            Save & close
          </Button>
          <Button
            className={`btn top contained white ${
              disableBefore ? "disabled" : ""
            }`}
            color="default"
            variant="contained"
            disabled={disableBefore}
            onClick={() => updateScene(-1)}
          >
            Before
          </Button>
          <Button
            className={`btn top contained white ${
              disableNext ? "disabled" : ""
            }`}
            color="default"
            variant="contained"
            disabled={disableNext}
            onClick={() => updateScene(1)}
          >
            Next
          </Button>
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
