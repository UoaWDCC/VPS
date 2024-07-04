import CountdownTimer from "../../../components/TimerComponent";
import componentResolver from "./componentResolver";

/**
 * This component displays the scene components on the screen when playing a scenario
 *
 * @component
 */
export default function PlayScenarioCanvas({ scene, incrementor }) {
  return (
    <>
      {scene.components?.map((component, index) =>
        componentResolver(
          component,
          index,
          () => component.nextScene && incrementor(component.nextScene)
        )
      )}
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
