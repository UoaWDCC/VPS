import React, { useState, useContext } from "react";
import { useGet } from "../../../hooks/crudHooks";
import componentResolver from "./componentResolver";
import PlayScenarioContext from "../../../context/PlayScenarioContext";
import ProgressBar from "./progressBar";
import CountdownTimer from "../../../components/TimerComponent";

/**
 * This component displays the scene components on the screen when playing a scenario
 *
 * @component
 */
export default function PlayScenarioCanvas() {
  const [currentScene, setCurrentScene] = useState(null);
  const [progress, setProgress] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const { scenarioId, currentSceneId, setCurrentSceneId } =
    useContext(PlayScenarioContext);

  useGet(
    `/api/scenario/${scenarioId}/scene/full/${currentSceneId}`,
    setCurrentScene,
    false
  );

  useGet(
    `api/scenario/${scenarioId}/scene/progress/${currentSceneId}`,
    setProgress,
    true
  );

  const componentOnClick = (component) => {
    if (component.type === "BUTTON" && component.nextScene !== "") {
      setCurrentSceneId(component.nextScene);
    }
  };

  return (
    <>
      {currentScene?.components?.map((component, index) =>
        componentResolver(component, index, () => componentOnClick(component))
      )}
      <ProgressBar value={progress * 100} />
      {currentScene?.time ? (
        <CountdownTimer
          targetDate={new Date().setSeconds(
            new Date().getSeconds() + currentScene?.time
          )}
        />
      ) : null}
    </>
  );
}
