import { usePost } from "hooks/crudHooks";
import { useContext } from "react";
import { useParams } from "react-router-dom";
import AuthenticationContext from "../../../context/AuthenticationContext";

import CountdownTimer from "../../../components/TimerComponent";
import componentResolver from "./componentResolver";

/**
 * This component displays the scene components on the screen when playing a scenario
 *
 * @component
 */

export default function PlayScenarioCanvas({ scene, incrementor }) {
  const { sceneId } = useParams();
  const { user, getUserIdToken } = useContext(AuthenticationContext);

  // Define the reset function inside the component
  const reset = async () => {
    const userId = user.uid;
    const reqBody = { userId, currentScene: sceneId };
    console.log("resetting");

    await usePost(`api/navigate/group/reset/:groupId`, reqBody, getUserIdToken);
    await usePost(`api/navigate/user/reset/:scenarioId`, reqBody, getUserIdToken);

    console.log("reset");
    // window.location.reload();
  };

  return (
    <>
      {scene.components?.map((component, index) => {
        const action = component.type === "RESET_BUTTON"
          ? reset
          : () => component.nextScene && incrementor(component.nextScene);

        return componentResolver(component, index, action);
      })}
      {scene.time && (
        <CountdownTimer
          targetDate={new Date().setSeconds(
            new Date().getSeconds() + scene.time
          )}
          sceneTime={scene.time}
        />
      )}
    </>
  );
}
