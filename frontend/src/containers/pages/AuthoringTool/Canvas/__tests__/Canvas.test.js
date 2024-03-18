import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AuthenticationContextProvider from "../../../../../context/AuthenticationContextProvider";
import AuthoringToolContextProvider from "../../../../../context/AuthoringToolContextProvider";
import ScenarioContext from "../../../../../context/ScenarioContext";
import SceneContext from "../../../../../context/SceneContext";
import Canvas from "../Canvas";

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
              <Canvas />
            </AuthoringToolContextProvider>
          </SceneContext.Provider>
        </ScenarioContext.Provider>
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
