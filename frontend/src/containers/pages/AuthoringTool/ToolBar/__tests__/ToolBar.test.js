import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import ScenarioContextProvider from "../../../../../context/ScenarioContextProvider";
import SceneContextProvider from "../../../../../context/SceneContextProvider";
import ToolBar from "../ToolBar";

test("ToolBar component snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <ScenarioContextProvider>
        <SceneContextProvider>
          <ToolBar />
        </SceneContextProvider>
      </ScenarioContextProvider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
