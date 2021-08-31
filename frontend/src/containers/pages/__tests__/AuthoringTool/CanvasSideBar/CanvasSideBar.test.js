import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import CanvasSideBar from "../../../AuthoringTool/CanvasSideBar/CanvasSideBar";

test("Scenario Selection page snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <CanvasSideBar />
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});