import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import AuthoringToolPage from "../AuthoringTool/AuthoringToolPage";
import ScenarioContextProvider from "../../../context/ScenarioContextProvider";

test("Scenario Selection page snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <ScenarioContextProvider>
        <AuthoringToolPage />
      </ScenarioContextProvider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
