import { useState } from "react";
import ResetConfirmationModal from "./modals/ResetConfirmationModal";
import { buildVisualScene } from "../authoring/pipeline";
import TextBox from "../authoring/elements/TextBox";
import Speech from "../authoring/elements/Speech";
import Ellipse from "../authoring/elements/Ellipse";
import Box from "../authoring/elements/Box";
import Image from "../authoring/elements/Image";
import Line from "../authoring/elements/Line";

const componentMap = {
  textbox: TextBox,
  speech: Speech,
  ellipse: Ellipse,
  box: Box,
  image: Image,
  line: Line,
};

function resolve(component) {
  const Fc = componentMap[component.type];
  if (component) return <Fc key={component.id} {...component} />;
}

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
  // const [isModalOpen, setIsModalOpen] = useState(false);

  // const handleResetClick = () => {
  //   setIsModalOpen(true);
  // };

  // const handleConfirmReset = async () => {
  //   setIsModalOpen(false);
  //   try {
  //     await reset();
  //   } catch (error) {
  //     console.error("Error during reset confirmation:", error);
  //   }
  // };

  // const handleCancelReset = () => {
  //   setIsModalOpen(false);
  // };

  const components = Object.values(buildVisualScene(scene).components)
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((c) => {
      const resolved = resolve(c);
      if (c.clickable) {
        return (
          <g
            key={c.id}
            className="cursor-pointer"
            onClick={() => buttonPressed(c)}
          >
            {resolved}
          </g>
        );
      }
      return resolved;
    });

  return (
    <div className="bg-white" style={{ width: "100vw", height: "100vh" }}>
      <svg id="main" className="w-full h-full" viewBox="0 0 1920 1080">
        <rect x="0" y="0" width="1920" height="1080" fill="white" />
        {components}
      </svg>
      {/* <ResetConfirmationModal
        isOpen={isModalOpen}
        onConfirm={handleConfirmReset}
        onClose={handleCancelReset}
      /> */}
    </div>
  );
}
