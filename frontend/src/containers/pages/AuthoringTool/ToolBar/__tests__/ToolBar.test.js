import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import ScenarioContextProvider from "../../../../../context/ScenarioContextProvider";
import SceneContextProvider from "../../../../../context/SceneContextProvider";
import ToolBar from "../ToolBar";
import AuthoringToolContextProvider from "../../../../../context/AuthoringToolContextProvider";
import ToolbarContextProvider from "../../../../../context/ToolbarContextProvider";
import AuthenticationContextProvider from "../../../../../context/AuthenticationContextProvider";

test("ToolBar component snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <AuthenticationContextProvider>
        <ScenarioContextProvider>
          <SceneContextProvider>
            <AuthoringToolContextProvider>
              <ToolbarContextProvider>
                <ToolBar />
              </ToolbarContextProvider>
            </AuthoringToolContextProvider>
          </SceneContextProvider>
        </ScenarioContextProvider>
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
