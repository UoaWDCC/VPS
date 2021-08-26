import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import { SceneSelectionPage } from "../SceneSelectionPage";
import SceneContextProvider from "../../../context/SceneContextProvider";
import ScenarioContextProvider from "../../../context/ScenarioContextProvider";

const dummyScenes = [
  { id: 1, name: "test1" },
  { id: 2, name: "test2" },
];

test("Scene Selection page snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <ScenarioContextProvider>
        <SceneContextProvider>
          <SceneSelectionPage data={dummyScenes} />
        </SceneContextProvider>
      </ScenarioContextProvider>
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
