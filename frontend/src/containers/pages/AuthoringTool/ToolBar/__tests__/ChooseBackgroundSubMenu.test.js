import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import ChooseBackgroundSubMenu from "../Background/ChooseBackgroundSubMenu";
import SceneContextProvider from "../../../../../context/SceneContextProvider";
import ScenarioContextProvider from "../../../../../context/ScenarioContextProvider";

test("ChooseBackgroundSubMenu component snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <ScenarioContextProvider>
        <SceneContextProvider>
          <ChooseBackgroundSubMenu />
        </SceneContextProvider>
      </ScenarioContextProvider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
