import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import ChooseBackgroundSubMenu from "../Background/ChooseBackgroundSubMenu";
import SceneContextProvider from "../../../../../context/SceneContextProvider";
import ScenarioContextProvider from "../../../../../context/ScenarioContextProvider";
import ToolbarContextProvider from "../../../../../context/ToolbarContextProvider";
import AuthenticationContextProvider from "../../../../../context/AuthenticationContextProvider";

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
