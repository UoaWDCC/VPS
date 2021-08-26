import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import SceneSelectionPage from "../SceneSelectionPage";
import ScenarioContextProvider from "../../../context/ScenarioContextProvider";
import SceneContextProvider from "../../../context/SceneContextProvider";

test("Scene Selection page snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <ScenarioContextProvider>
        <SceneContextProvider>
          <SceneSelectionPage useTestData />
        </SceneContextProvider>
      </ScenarioContextProvider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
