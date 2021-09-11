import React from "react";
import renderer from "react-test-renderer";
import { BrowserRouter } from "react-router-dom";
import ModalDialogue from "../ModalDialogue";

test("ModalDialogue component snapshot test", () => {
  const component = renderer.create(
    <BrowserRouter>
      <ModalDialogue />
    </BrowserRouter>
  );

  const tree = component.toJSON();
  expect(tree).toMatchSnapshot();
});
