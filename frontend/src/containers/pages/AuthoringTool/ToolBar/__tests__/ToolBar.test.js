import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import ToolBar from "../ToolBar";

test("ToolBar component snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <ToolBar />
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
