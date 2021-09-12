import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import { SceneSelectionPage } from "../SceneSelectionPage";
import SceneContextProvider from "../../../context/SceneContextProvider";
import ScenarioContextProvider from "../../../context/ScenarioContextProvider";
import ScenarioContext from "../../../context/ScenarioContext";

const dummyScenes = [
  { id: 1, name: "test1" },
  { id: 2, name: "test2" },
];

test("Scene Selection page snapshot test", () => {
  const context = {
    currentScenario: { _id: "scenarioId" },
  };

  const component = renderer.create(
    <BrowserRouter>
      <ScenarioContext.Provider value={context}>
        <SceneContextProvider>
          <SceneSelectionPage data={dummyScenes} />
        </SceneContextProvider>
      </ScenarioContext.Provider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
