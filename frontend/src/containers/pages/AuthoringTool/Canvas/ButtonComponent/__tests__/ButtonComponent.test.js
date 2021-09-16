import React from "react";
import { render } from "@testing-library/react";
import ButtonComponent from "../ButtonComponent";

test("Add button component snapshot test", () => {
  const { baseElement } = render(
    <ButtonComponent component={{}} />
  );

  expect(baseElement).toMatchSnapshot();
});