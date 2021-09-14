import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ScenarioSelectionPage from "../ScenarioSelectionPage";
import ScenarioContext from "../../../context/ScenarioContext";

const dummyScenarios = [
  { _id: 1, name: "test1" },
  { _id: 2, name: "test2" },
];

const context = {
  currentScenario: { _id: "scenarioId" },
  currentScene: { _id: "sceneId", components: [] },
  scenarios: dummyScenarios,
  setCurrentScenario: () => {},
  reFetch: () => {},
};

test("Scenario Selection page snapshot test", () => {
  const { baseElement } = render(
    <BrowserRouter>
      <ScenarioContext.Provider value={context}>
        <ScenarioSelectionPage />
      </ScenarioContext.Provider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
