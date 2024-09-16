import { useState } from "react";
import ResetConfirmationModal from "./modals/ResetConfirmationModal";
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

  const setFlags = (component) => {
    if (component.flagAdditions) {
      const newFlags = Object.keys(component.flagAdditions).filter(
        (key) => component.flagAdditions[key] === true
      );
      setAddFlags(newFlags);
    } else {
      setAddFlags([]);
    }

    if (component.flagDeletions) {
      const removalFlags = Object.keys(component.flagDeletions).filter(
        (key) => component.flagDeletions[key] === true
      );
      setRemoveFlags(removalFlags);
    } else {
      setRemoveFlags([]);
    }
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
            action = () => {
              if (component.nextScene) {
                incrementor(component.nextScene);
                setFlags(component);
              }
            };
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