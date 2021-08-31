import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import SceneSettings from "../../../AuthoringTool/CanvasSideBar/SceneSettings";

test("Scenario Selection page snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <SceneSettings />
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
