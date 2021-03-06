import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import CanvasSideBar from "../CanvasSideBar";
import ScenarioContextProvider from "../../../../../context/ScenarioContextProvider";
import SceneContextProvider from "../../../../../context/SceneContextProvider";
import AuthoringToolContextProvider from "../../../../../context/AuthoringToolContextProvider";
import AuthenticationContextProvider from "../../../../../context/AuthenticationContextProvider";

test("Scenario Selection page snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <AuthenticationContextProvider>
        <ScenarioContextProvider>
          <SceneContextProvider>
            <AuthoringToolContextProvider>
              <CanvasSideBar />
            </AuthoringToolContextProvider>
          </SceneContextProvider>
        </ScenarioContextProvider>
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
