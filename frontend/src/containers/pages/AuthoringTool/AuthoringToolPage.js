import React, { useContext } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@material-ui/core";
import TopBar from "../../../components/TopBar";
import ToolBar from "./ToolBar/ToolBar";
import Canvas from "./Canvas";
import CanvasSideBar from "./CanvasSideBar/CanvasSideBar";
import ScreenContainer from "../../../components/ScreenContainer";
import ScenarioContext from "../../../context/ScenarioContext";
import { useGet, usePut } from "../../../hooks/crudHooks";
import SceneContext from "../../../context/SceneContext";

export default function AuthoringToolPage() {
  const { scenarioId, sceneId } = useParams();
  const { currentScene, setCurrentScene } = useContext(SceneContext);
  const { currentScenario } = useContext(ScenarioContext);
  useGet(
    `/api/scenario/${currentScenario?._id}/scene/full/${currentScene?._id}`,
    setCurrentScene
  );

  async function saveScene() {
    await usePut(`/api/scenario/${scenarioId}/scene/${sceneId}`, {
      name: currentScene.name,
      components: currentScene?.components,
    });
  }

  return (
    <>
      <ScreenContainer vertical>
        <TopBar back={`/scenario/${currentScenario?._id}`}>
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
