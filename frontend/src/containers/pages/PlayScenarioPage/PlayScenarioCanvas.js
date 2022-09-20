import React, { useState, useContext } from "react";
import { useGet, usePost, usePut } from "../../../hooks/crudHooks";
import componentResolver from "./componentResolver";
import PlayScenarioContext from "../../../context/PlayScenarioContext";
import ProgressBar from "./progressBar";
import CountdownTimer from "../../../components/TimerComponent";
import AuthenticationContext from "../../../context/AuthenticationContext";

/**
 * This component displays the scene components on the screen when playing a scenario
 *
 * @component
 */
export default function PlayScenarioCanvas(props) {
  const { progress, graph } = props;
  const [currentScene, setCurrentScene] = useState(null);
  const [maxProgress, setMaxProgress] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const { scenarioId, currentSceneId, setCurrentSceneId } =
    useContext(PlayScenarioContext);

  const { user } = useContext(AuthenticationContext);

  useGet(
    `/api/scenario/${scenarioId}/scene/full/${currentSceneId}`,
    setCurrentScene,
    false
  );

  const componentOnClick = (component) => {
    if (component.type === "BUTTON" && component.nextScene !== "") {
      setMaxProgress(Math.max(progress, maxProgress));
      graph.visit(component.nextScene);
      if (graph.isEndScene(component.nextScene)) {
        // update db

        const userData = {
          name: user.displayName,
          uid: user.uid,
          email: user.email,
        };

        usePost("/api/user", userData);
      }
      setCurrentSceneId(component.nextScene);
    }
  };

  return (
    <>
      {currentScene?.components?.map((component, index) =>
        componentResolver(component, index, () => componentOnClick(component))
      )}
      <ProgressBar value={Math.max(progress, maxProgress) * 100} />
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
