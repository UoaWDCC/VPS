import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import ChooseBackgroundSubMenu from "../Background/ChooseBackgroundSubMenu";

test("ChooseBackgroundSubMenu component snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <ChooseBackgroundSubMenu />
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
