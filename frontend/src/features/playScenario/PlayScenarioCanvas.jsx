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
  if (Fc) return <Fc key={component.id} {...component} />;
  return null;
}

function injectStateVariables(scene, stateVariables) {
  if (!stateVariables) return scene;

  const varMap = new Map(stateVariables.map((v) => [v.name, v.value]));
  const regex = /\$\$(.*?)\$\$/g;

  return {
    ...scene,
    components: Object.fromEntries(
      Object.entries(scene.components).map(([id, component]) => {
        if (component.type !== "textbox") return [id, component];

        const newBlocks = component.document.blocks.map((block) => {
          const newSpans = [];

          for (const span of block.spans) {
            const pieces = [];
            let lastIndex = 0;
            let match;

            while ((match = regex.exec(span.text)) !== null) {
              if (match.index > lastIndex) {
                pieces.push(span.text.slice(lastIndex, match.index));
              }
              const variableName = match[1];
              if (varMap.has(variableName)) {
                pieces.push(String(varMap.get(variableName)));
              } else {
                pieces.push(match[0]);
              }
              lastIndex = regex.lastIndex;
            }

            if (lastIndex < span.text.length) {
              pieces.push(span.text.slice(lastIndex));
            }

            regex.lastIndex = 0;

            // Only add non-empty pieces
            for (const text of pieces) {
              if (text !== "") {
                newSpans.push({ text });
              }
            }

            // Fallback: if substitution produced no visible text, preserve the original
            if (pieces.length === 0) {
              newSpans.push(span);
            }
          }

          return { ...block, spans: newSpans };
        });

        return [
          id,
          {
            ...component,
            document: { ...component.document, blocks: newBlocks },
          },
        ];
      })
    ),
  };
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
  stateVariables,
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

  const sceneToRender = injectStateVariables(scene, stateVariables);

  const components = Object.values(buildVisualScene(sceneToRender).components)
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
