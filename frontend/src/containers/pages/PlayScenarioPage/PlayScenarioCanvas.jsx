import ResetConfirmationModal from "components/ResetConfirmationModal";
import { useState } from "react";
import CountdownTimer from "../../../components/TimerComponent";
import componentResolver from "./componentResolver";

/**
 * This component displays the scene components on the screen when playing a scenario
 *
 * @component
 */

export default function PlayScenarioCanvas({ scene, incrementor, reset }) {
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
        const action =
          component.type === "RESET_BUTTON"
            ? handleResetClick
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
      <ResetConfirmationModal
        isOpen={isModalOpen}
        onConfirm={handleConfirmReset}
        onClose={handleCancelReset}
      />
    </>
  );
}
