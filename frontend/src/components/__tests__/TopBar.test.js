import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import TopBar from "../TopBar";
import ScenarioContext from "../../context/ScenarioContext";
import SceneContextProvider from "../../context/SceneContextProvider";

test("Top Bar component snapshot test", () => {
  const context = {
    currentScenario: { _id: "scenarioId" },
  };

  const component = renderer.create(
    <BrowserRouter>
      <ScenarioContext.Provider value={context}>
        <SceneContextProvider>
          <TopBar />
        </SceneContextProvider>
      </ScenarioContext.Provider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
