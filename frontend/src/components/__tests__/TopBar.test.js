import { BrowserRouter } from "react-router-dom";
import renderer from "react-test-renderer";
import AuthenticationContextProvider from "../../context/AuthenticationContextProvider";
import ScenarioContext from "../../context/ScenarioContext";
import SceneContextProvider from "../../context/SceneContextProvider";
import TopBar from "../TopBar";

test("Top Bar component snapshot test", () => {
  const context = {
    currentScenario: { _id: "scenarioId" },
  };

  const component = renderer.create(
    <BrowserRouter>
      <AuthenticationContextProvider>
        <ScenarioContext.Provider value={context}>
          <SceneContextProvider>
            <TopBar />
          </SceneContextProvider>
        </ScenarioContext.Provider>
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
