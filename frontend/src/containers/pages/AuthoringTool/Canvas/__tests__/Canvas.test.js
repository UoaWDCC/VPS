import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AuthoringToolPage from "../../AuthoringToolPage";
import ScenarioContext from "../../../../../context/ScenarioContext";
import SceneContext from "../../../../../context/SceneContext";
import AuthoringToolContextProvider from "../../../../../context/AuthoringToolContextProvider";

test("Authoring Tool page snapshot test", () => {
  const context = {
    currentScenario: { _id: "scenarioId" },
    currentScene: { _id: "sceneId", components: [] },
    setMonitorChange: () => {},
  };

  const { baseElement } = render(
    <BrowserRouter>
      <AuthoringToolContextProvider>
        <ScenarioContext.Provider value={context}>
          <SceneContext.Provider value={context}>
            <AuthoringToolPage />
          </SceneContext.Provider>
        </ScenarioContext.Provider>
      </AuthoringToolContextProvider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
