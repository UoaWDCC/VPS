import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ModalDialogue from "../ModalDialogue";

test("ModalDialogue component snapshot test", () => {
  const { baseElement } = render(
    <BrowserRouter>
      <ModalDialogue isShowing />
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
