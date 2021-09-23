import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
  const [firstTimeRender, setFirstTimeRender] = useState(true);

  useGet(
    `/api/scenario/${currentScenario?._id}/scene/full/${currentScene?._id}`,
    setCurrentScene
  );

  useEffect(() => {
    if (firstTimeRender) {
      setFirstTimeRender(false);
    } else {
      setMonitorChange(true);
    }
  }, [currentScene]);

  async function saveScene() {
    setSelect(null);
    await usePut(`/api/scenario/${scenarioId}/scene/${sceneId}`, {
      name: currentScene.name,
      components: currentScene?.components,
    });
    reFetch();
    setHasChange(false);
  }

  return (
    <>
      <ScreenContainer vertical>
        <TopBar back={`/scenario/${currentScenario?._id}`} confirmModal>
          <Button
            className="btn top contained white"
            color="default"
            variant="contained"
            onClick={saveScene}
          >
            Save
          </Button>
        </TopBar>
        <ToolBar />
        <div className="flex" style={{ height: "100%" }}>
          <Canvas />
          <CanvasSideBar />
        </div>
      </ScreenContainer>
    </>
  );
}
