import ResetConfirmationModal from "components/ResetConfirmationModal";
import { useState } from "react";
import CountdownTimer from "../../../components/TimerComponent";
import componentResolver from "./componentResolver";

/**
 * This component displays the scene components on the screen when playing a scenario
 *
 * @component
 */

export default function PlayScenarioCanvas({
  scene,
  incrementor,
  reset,
  setAddFlags,
  setRemoveFlags,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleResetClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmReset = () => {
    setIsModalOpen(false);
    reset();
  };

  const handleCancelReset = () => {
    setIsModalOpen(false);
  };
  return (
    <>
      {scene.components?.map((component, index) => {
        let action = () =>
          component.nextScene && incrementor(component.nextScene);
        switch (component.type) {
          case "RESET_BUTTON":
            action = handleResetClick;
            break;
          case "BUTTON":
            setAddFlags(component.flagAdditions);
            setRemoveFlags(component.flagDeletions);
            break;
          default:
            break;
        }

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
      <ResetConfirmationModal
        isOpen={isModalOpen}
        onConfirm={handleConfirmReset}
        onClose={handleCancelReset}
      />
    </>
  );
}
