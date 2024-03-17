import { BrowserRouter } from "react-router-dom";
import renderer from "react-test-renderer";
import AuthenticationContextProvider from "../../../../../context/AuthenticationContextProvider";
import AuthoringToolContextProvider from "../../../../../context/AuthoringToolContextProvider";
import ScenarioContextProvider from "../../../../../context/ScenarioContextProvider";
import SceneContextProvider from "../../../../../context/SceneContextProvider";
import ComponentProperties from "../ComponentProperties";

test("Scenario Selection page snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <AuthenticationContextProvider>
        <ScenarioContextProvider>
          <SceneContextProvider>
            <AuthoringToolContextProvider>
              <ComponentProperties />
            </AuthoringToolContextProvider>
          </SceneContextProvider>
        </ScenarioContextProvider>
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
