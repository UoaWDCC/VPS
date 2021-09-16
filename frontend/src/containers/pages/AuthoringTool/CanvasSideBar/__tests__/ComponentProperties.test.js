import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import ComponentProperties from "../ComponentProperties";
import ScenarioContextProvider from "../../../../../context/ScenarioContextProvider";
import SceneContextProvider from "../../../../../context/SceneContextProvider";
import AuthoringToolContextProvider from "../../../../../context/AuthoringToolContextProvider";

test("Scenario Selection page snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <ScenarioContextProvider>
        <SceneContextProvider>
          <AuthoringToolContextProvider>
            <ComponentProperties />
          </AuthoringToolContextProvider>
        </SceneContextProvider>
      </ScenarioContextProvider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
