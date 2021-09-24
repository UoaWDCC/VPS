import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import Thumbnail from "../Thumbnail";

test("Thumbnail component snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <Thumbnail />
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
