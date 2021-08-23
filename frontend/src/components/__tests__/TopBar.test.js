import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import TopBar from "../TopBar";

test("Top Bar component snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <TopBar />
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
