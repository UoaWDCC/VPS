import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import AuthoringToolPage from "../AuthoringToolPage";
import ScenarioContextProvider from "../../../../context/ScenarioContextProvider";
import SceneContextProvider from "../../../../context/SceneContextProvider";

test("Scenario Selection page snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <ScenarioContextProvider>
        <SceneContextProvider>
          <AuthoringToolPage />
        </SceneContextProvider>
      </ScenarioContextProvider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
