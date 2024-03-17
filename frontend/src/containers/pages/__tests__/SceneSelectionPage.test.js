import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import AuthenticationContextProvider from "../../../context/AuthenticationContextProvider";
import ScenarioContext from "../../../context/ScenarioContext";
import SceneContext from "../../../context/SceneContext";
import { SceneSelectionPage } from "../SceneSelectionPage";

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
      <AuthenticationContextProvider>
        <ScenarioContext.Provider value={context}>
          <SceneContext.Provider value={context}>
            <SceneSelectionPage data={dummyScenes} />
          </SceneContext.Provider>
        </ScenarioContext.Provider>
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
