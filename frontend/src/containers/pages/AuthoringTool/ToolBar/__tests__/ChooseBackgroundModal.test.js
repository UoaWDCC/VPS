import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ChooseBackgroundModal from "../Background/ChooseBackgroundModal";

test("ChooseBackgroundModal component snapshot test", () => {
  const { baseElement } = render(
    <BrowserRouter>
      <ChooseBackgroundModal isShowing />
    </BrowserRouter>
  );

  expect(baseElement).toMatchSnapshot();
});
