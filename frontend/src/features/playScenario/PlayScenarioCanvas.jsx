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
  buttonPressed,
  reset,
  setAddFlags,
  setRemoveFlags,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleResetClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmReset = async () => {
    setIsModalOpen(false);
    try {
      await reset();
    } catch (error) {
      console.error("Error during reset confirmation:", error);
    }
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
    <div className="bg-white" style={{ width: "100vw", height: "100vh" }}>
      {scene.components?.map((component, index) => {
        let action = () => component.nextScene && buttonPressed(component);
        switch (component.type) {
          case "RESET_BUTTON":
            action = handleResetClick;
            break;
          case "BUTTON":
            action = () => {
              buttonPressed(component);
              setFlags(component);
            };
            break;
          default:
            break;
        }

        return componentResolver(component, index, action);
      })}
      <ResetConfirmationModal
        isOpen={isModalOpen}
        onConfirm={handleConfirmReset}
        onClose={handleCancelReset}
      />
    </div>
  );
}
