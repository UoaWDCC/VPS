import React, { useContext } from "react";
import TopBar from "../../../components/TopBar";
import ToolBar from "./ToolBar";
import Canvas from "./Canvas";
import CanvasSideBar from "./CanvasSideBar/CanvasSideBar";
import ScreenContainer from "../../../components/ScreenContainer";
import ScenarioContext from "../../../context/ScenarioContext";
import { useGet } from "../../../hooks/crudHooks";
import SceneContext from "../../../context/SceneContext";

export default function AuthoringToolPage() {
  const { currentScene, setCurrentScene } = useContext(SceneContext);
  const { currentScenario } = useContext(ScenarioContext);
  useGet(
    `/api/scenario/${currentScenario?._id}/scene/full/${currentScene?._id}`,
    setCurrentScene
  );
  return (
    <>
      <ScreenContainer vertical>
        <TopBar back={`/scenario/${currentScenario?._id}`} />
        <ToolBar />
        <div className="flex" style={{ height: "100%" }}>
          <Canvas />
          <CanvasSideBar />
        </div>
      </ScreenContainer>
    </>
  );
}
