import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import SceneSettings from "../SceneSettings";
import ScenarioContextProvider from "../../../../../context/ScenarioContextProvider";
import SceneContextProvider from "../../../../../context/SceneContextProvider";
import AuthenticationContextProvider from "../../../../../context/AuthenticationContextProvider";

test("Scenario Selection page snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <AuthenticationContextProvider>
        <ScenarioContextProvider>
          <SceneContextProvider>
            <SceneSettings />
          </SceneContextProvider>
        </ScenarioContextProvider>
      </AuthenticationContextProvider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
