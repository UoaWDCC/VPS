import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { SceneSelectionPage } from "../SceneSelectionPage";
import SceneContext from "../../../context/SceneContext";
import ScenarioContext from "../../../context/ScenarioContext";

const dummyScenes = [
  { _id: 1, name: "test1" },
  { _id: 2, name: "test2" },
];

test("Scene Selection page snapshot test", () => {
  const context = {
    currentScenario: { _id: "scenarioId" },
    currentScene: { _id: "sceneId", components: [] },
    setCurrentScene: () => {},
  };

  const { baseElement } = render(
    <BrowserRouter>
      <ScenarioContext.Provider value={context}>
        <SceneContext.Provider value={context}>
          <SceneSelectionPage data={dummyScenes} />
        </SceneContext.Provider>
      </ScenarioContext.Provider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
