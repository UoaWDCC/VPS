import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import ChooseBackgroundModal from "../Background/ChooseBackgroundModal";

test("ChooseBackgroundModal component snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <ChooseBackgroundModal />
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
