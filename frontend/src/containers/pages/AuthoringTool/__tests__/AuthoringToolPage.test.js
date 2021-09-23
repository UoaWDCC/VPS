import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AuthoringToolPage from "../AuthoringToolPage";
import SceneContext from "../../../../context/SceneContext";
import ScenarioContext from "../../../../context/ScenarioContext";
import AuthoringToolContextProvider from "../../../../context/AuthoringToolContextProvider";
import AuthenticationContextProvider from "../../../../context/AuthenticationContextProvider";

test("Authoring Tool page snapshot test", () => {
  const context = {
    currentScenario: { _id: "scenarioId" },
    currentScene: { _id: "sceneId", components: [] },
    setMonitorChange: () => {},
  };

  const { baseElement } = render(
    <BrowserRouter>
      <AuthenticationContextProvider>
        <ScenarioContext.Provider value={context}>
          <SceneContext.Provider value={context}>
            <AuthoringToolContextProvider>
              <AuthoringToolPage />
            </AuthoringToolContextProvider>
          </SceneContext.Provider>
        </ScenarioContext.Provider>
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
