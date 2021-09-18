import React, { useState, useContext } from "react";
import { useGet } from "../../../hooks/crudHooks";
import componentResolver from "./componentResolver";
import PlayingScenarioContext from "../../../context/PlayingScenarioContext";

export default function PlayingScenarioCanvas() {
  const [currentScene, setCurrentScene] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const { scenarioId, currentSceneId, setCurrentSceneId } = useContext(
    PlayingScenarioContext
  );

  useGet(
    `/api/scenario/${scenarioId}/scene/full/${currentSceneId}`,
    setCurrentScene
  );

  const componentOnClick = () => {
    console.log(`Component is clicked`);
    // setCurrentSceneId(null);
  };

  return (
    <>
      {currentScene?.components?.map((component, index) =>
        componentResolver(component, index, componentOnClick)
      )}
    </>
  );
}
