import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ScenarioSelectionPage from "../ScenarioSelectionPage";
import ScenarioContext from "../../../context/ScenarioContext";
import AuthenticationContextProvider from "../../../context/AuthenticationContextProvider";

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
  reFetch2: () => {},
};

test("Scenario Selection page snapshot test", () => {
  const { baseElement } = render(
    <BrowserRouter>
      <AuthenticationContextProvider>
        <ScenarioContext.Provider value={context}>
          <ScenarioSelectionPage />
        </ScenarioContext.Provider>
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
