import CountdownTimer from "../../../components/TimerComponent";
import componentResolver from "./componentResolver";
import ProgressBar from "./progressBar";

/**
 * This component displays the scene components on the screen when playing a scenario
 *
 * @component
 */
export default function PlayScenarioCanvas({ progress, scene, incrementor }) {
  return (
    <>
      {scene.components?.map((component, index) =>
        componentResolver(
          component,
          index,
          () => component.nextScene && incrementor(component.nextScene)
        )
      )}
      <ProgressBar value={progress * 100} />
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
