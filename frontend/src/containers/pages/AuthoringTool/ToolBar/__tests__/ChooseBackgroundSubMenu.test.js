import { BrowserRouter } from "react-router-dom";
import renderer from "react-test-renderer";
import AuthenticationContextProvider from "../../../../../context/AuthenticationContextProvider";
import ScenarioContextProvider from "../../../../../context/ScenarioContextProvider";
import SceneContextProvider from "../../../../../context/SceneContextProvider";
import ToolbarContextProvider from "../../../../../context/ToolbarContextProvider";
import ChooseBackgroundSubMenu from "../Background/ChooseBackgroundSubMenu";

test("ChooseBackgroundSubMenu component snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <AuthenticationContextProvider>
        <ScenarioContextProvider>
          <SceneContextProvider>
            <ToolbarContextProvider>
              <ChooseBackgroundSubMenu />
            </ToolbarContextProvider>
          </SceneContextProvider>
        </ScenarioContextProvider>
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
