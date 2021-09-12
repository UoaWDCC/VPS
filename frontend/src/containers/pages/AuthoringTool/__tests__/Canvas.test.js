import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import AuthoringToolPage from "../AuthoringToolPage";
import SceneContextProvider from "../../../../context/SceneContextProvider";
import ScenarioContext from "../../../../context/ScenarioContext";

test("Scenario Selection page snapshot test", () => {
  const context = {
    currentScenario: { _id: "scenarioId" },
  };

  const component = renderer.create(
    <BrowserRouter>
      <ScenarioContext.Provider value={context}>
        <SceneContextProvider>
          <AuthoringToolPage />
        </SceneContextProvider>
      </ScenarioContext.Provider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
