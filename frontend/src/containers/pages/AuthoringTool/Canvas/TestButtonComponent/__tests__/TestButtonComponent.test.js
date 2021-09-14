import React from "react";
import { render } from "@testing-library/react";
import TestButtonComponent from "../TestButtonComponent";

test("Scenario Selection page snapshot test", () => {
  const { baseElement } = render(<TestButtonComponent />);

  expect(baseElement).toMatchSnapshot();
});
