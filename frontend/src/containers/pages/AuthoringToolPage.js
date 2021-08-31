import React, { useContext } from "react";
import TopBar from "../../components/TopBar";
import ScreenContainer from "../../components/ScreenContainer";
import SceneContext from "../../context/SceneContext";
import ScenarioContext from "../../context/ScenarioContext";
import { useGet } from "../../hooks/crudHooks";

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
        <h1>Authoring Tool Page</h1>
      </ScreenContainer>
    </>
  );
}
